const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { pipeline } = require('stream/promises');
const { Readable } = require('stream');
const { Transform } = require('stream');
const ManagedFile = require('../models/ManagedFile');

const STORAGE_DIR = path.join(__dirname, '../../storage/managed-files');
const MAX_DOWNLOAD_BYTES = 50 * 1024 * 1024;

function cleanFileName(name) {
    const parsed = path.parse(name || 'downloaded-file');
    const base = parsed.name.replace(/[^\w가-힣.-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'file';
    const ext = parsed.ext.replace(/[^\w.]+/g, '').slice(0, 20);
    return `${base}${ext}`;
}

function uniqueStoredName(originalName) {
    const safeName = cleanFileName(originalName);
    const parsed = path.parse(safeName);
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${parsed.name}${parsed.ext}`;
}

function fileNameFromUrl(url) {
    const parsedUrl = new URL(url);
    const candidate = path.basename(decodeURIComponent(parsedUrl.pathname));
    return candidate && candidate !== '/' ? candidate : 'downloaded-file';
}

async function ensureStorageDir() {
    await fsp.mkdir(STORAGE_DIR, { recursive: true });
}

async function saveRemoteFile(fileUrl) {
    const response = await fetch(fileUrl, { redirect: 'follow' });
    if (!response.ok) {
        throw new Error(`다운로드 실패: HTTP ${response.status}`);
    }

    const contentLength = Number(response.headers.get('content-length') || 0);
    if (contentLength > MAX_DOWNLOAD_BYTES) {
        throw new Error('50MB 이하 파일만 다운로드할 수 있습니다.');
    }

    const originalName = cleanFileName(fileNameFromUrl(response.url || fileUrl));
    const storedName = uniqueStoredName(originalName);
    const destination = path.join(STORAGE_DIR, storedName);
    let receivedBytes = 0;

    const sizeGuard = new Transform({
        transform(chunk, encoding, callback) {
            receivedBytes += chunk.length;
            if (receivedBytes > MAX_DOWNLOAD_BYTES) {
                callback(new Error('50MB 이하 파일만 다운로드할 수 있습니다.'));
                return;
            }
            callback(null, chunk);
        }
    });

    await pipeline(Readable.fromWeb(response.body), sizeGuard, fs.createWriteStream(destination));

    return {
        original_name: originalName,
        stored_name: storedName,
        source_url: fileUrl,
        mime_type: response.headers.get('content-type'),
        size_bytes: receivedBytes || contentLength
    };
}

exports.list = async (req, res) => {
    try {
        const files = await ManagedFile.findAll();
        res.render('admin/files/list', {
            title: '파일 관리',
            layout: 'admin/layout',
            files,
            message: req.query.message || null,
            error: req.query.error || null
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.upload = async (req, res) => {
    try {
        if (!req.file) {
            return res.redirect('/admin/files?error=' + encodeURIComponent('업로드할 파일을 선택하세요.'));
        }

        await ManagedFile.create({
            original_name: req.file.originalname,
            stored_name: req.file.filename,
            mime_type: req.file.mimetype,
            size_bytes: req.file.size,
            note: req.body.note
        });

        res.redirect('/admin/files?message=' + encodeURIComponent('파일을 업로드했습니다.'));
    } catch (err) {
        console.error(err);
        res.redirect('/admin/files?error=' + encodeURIComponent('파일 업로드에 실패했습니다.'));
    }
};

exports.downloadFromUrl = async (req, res) => {
    try {
        const fileUrl = (req.body.file_url || '').trim();
        if (!fileUrl) {
            return res.redirect('/admin/files?error=' + encodeURIComponent('다운로드할 URL을 입력하세요.'));
        }

        const parsedUrl = new URL(fileUrl);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            return res.redirect('/admin/files?error=' + encodeURIComponent('http 또는 https URL만 사용할 수 있습니다.'));
        }

        await ensureStorageDir();
        const downloadedFile = await saveRemoteFile(fileUrl);
        await ManagedFile.create({
            ...downloadedFile,
            note: req.body.note
        });

        res.redirect('/admin/files?message=' + encodeURIComponent('URL 파일을 다운로드했습니다.'));
    } catch (err) {
        console.error(err);
        res.redirect('/admin/files?error=' + encodeURIComponent(err.message || 'URL 다운로드에 실패했습니다.'));
    }
};

exports.download = async (req, res) => {
    try {
        const file = await ManagedFile.findById(req.params.id);
        if (!file) return res.status(404).send('File not found');

        res.download(path.join(STORAGE_DIR, file.stored_name), file.original_name);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.remove = async (req, res) => {
    try {
        const file = await ManagedFile.findById(req.params.id);
        if (file) {
            await fsp.rm(path.join(STORAGE_DIR, file.stored_name), { force: true });
            await ManagedFile.delete(file.id);
        }

        res.redirect('/admin/files?message=' + encodeURIComponent('파일을 삭제했습니다.'));
    } catch (err) {
        console.error(err);
        res.redirect('/admin/files?error=' + encodeURIComponent('파일 삭제에 실패했습니다.'));
    }
};

exports.storageDir = STORAGE_DIR;
exports.uniqueStoredName = uniqueStoredName;

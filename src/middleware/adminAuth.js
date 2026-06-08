const crypto = require('crypto');
const pool = require('../config/db');

const DEFAULT_ADMIN_PASSWORD = 'freshmeat2026!';
const ADMIN_PASSWORD_KEY = 'admin_password_hash';

function getAdminPassword() {
    return process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
}

async function ensureAdminSettingsSchema() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS admin_settings (
            setting_key VARCHAR(100) PRIMARY KEY,
            setting_value TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('base64url')) {
    const hash = crypto.pbkdf2Sync(String(password), salt, 120000, 32, 'sha256').toString('base64url');
    return `pbkdf2_sha256$120000$${salt}$${hash}`;
}

function verifyHash(password, storedHash) {
    const [method, iterations, salt, expected] = String(storedHash || '').split('$');
    if (method !== 'pbkdf2_sha256' || !iterations || !salt || !expected) return false;
    const hash = crypto.pbkdf2Sync(String(password), salt, Number(iterations), 32, 'sha256').toString('base64url');
    return safeCompare(hash, expected);
}

async function getStoredPasswordHash() {
    await ensureAdminSettingsSchema();
    const [rows] = await pool.query(
        'SELECT setting_value FROM admin_settings WHERE setting_key = ?',
        [ADMIN_PASSWORD_KEY]
    );
    return rows[0]?.setting_value || null;
}

async function verifyAdminPassword(password) {
    const storedHash = await getStoredPasswordHash();
    if (storedHash) return verifyHash(password, storedHash);
    return safeCompare(password, getAdminPassword());
}

async function setAdminPassword(password) {
    await ensureAdminSettingsSchema();
    await pool.query(
        `INSERT INTO admin_settings (setting_key, setting_value)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [ADMIN_PASSWORD_KEY, hashPassword(password)]
    );
}

function safeCompare(value, expected) {
    const left = Buffer.from(String(value || ''));
    const right = Buffer.from(String(expected || ''));
    if (left.length !== right.length) return false;
    return crypto.timingSafeEqual(left, right);
}

function requireAdmin(req, res, next) {
    if (req.session?.adminAuthenticated) return next();
    if (req.accepts('html')) {
        return res.status(401).send(`
            <!doctype html>
            <html lang="ko">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>관리자 인증 필요</title>
                <style>
                    body{font-family:sans-serif;background:#fffaf2;color:#22201d;display:grid;place-items:center;min-height:100vh;margin:0}
                    main{max-width:420px;padding:28px;border:1px solid #eee7dc;border-radius:8px;background:#fff;box-shadow:0 16px 42px rgba(66,42,18,.08)}
                    h1{margin:0 0 10px;font-size:1.45rem;color:#8f171d}
                    p{line-height:1.6;color:#6e6a63}
                    a{color:#214f35;font-weight:800}
                </style>
            </head>
            <body>
                <main>
                    <h1>관리자 인증이 필요합니다</h1>
                    <p>상점 화면에서 <strong>Ctrl + Shift + P</strong>를 누른 뒤 관리자 비밀번호를 입력해주세요.</p>
                    <a href="/">상점으로 이동</a>
                </main>
            </body>
            </html>
        `);
    }
    return res.status(401).json({ ok: false, message: '관리자 인증이 필요합니다.' });
}

async function login(req, res) {
    const { password } = req.body || {};
    if (!(await verifyAdminPassword(password))) {
        return res.status(401).json({ ok: false, message: '관리자 비밀번호가 맞지 않습니다.' });
    }
    req.session.adminAuthenticated = true;
    res.json({ ok: true, redirect: '/admin' });
}

async function changePassword(req, res) {
    const { current_password, new_password, confirm_password } = req.body || {};
    if (!(await verifyAdminPassword(current_password))) {
        return res.status(400).render('admin/settings', {
            title: '관리자 설정',
            layout: 'admin/layout',
            message: null,
            error: '현재 비밀번호가 맞지 않습니다.'
        });
    }
    if (!new_password || String(new_password).length < 8) {
        return res.status(400).render('admin/settings', {
            title: '관리자 설정',
            layout: 'admin/layout',
            message: null,
            error: '새 비밀번호는 8자 이상이어야 합니다.'
        });
    }
    if (new_password !== confirm_password) {
        return res.status(400).render('admin/settings', {
            title: '관리자 설정',
            layout: 'admin/layout',
            message: null,
            error: '새 비밀번호 확인이 일치하지 않습니다.'
        });
    }

    await setAdminPassword(new_password);
    req.session.adminAuthenticated = true;
    res.render('admin/settings', {
        title: '관리자 설정',
        layout: 'admin/layout',
        message: '관리자 비밀번호를 변경했습니다.',
        error: null
    });
}

function logout(req, res) {
    if (req.session) {
        req.session.adminAuthenticated = false;
    }
    res.redirect('/');
}

module.exports = {
    requireAdmin,
    login,
    logout,
    changePassword
};

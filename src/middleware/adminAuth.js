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

function loginPageHtml(error = '') {
    const errorMarkup = error ? `<p class="error">${error}</p>` : '';
    return `
        <!doctype html>
        <html lang="ko">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>관리자 로그인</title>
            <style>
                *{box-sizing:border-box}
                body{font-family:'Noto Sans KR',sans-serif;background:#fff8ee;color:#22201d;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px}
                main{width:min(420px,100%);padding:34px 30px;border:1px solid #eadfce;border-radius:16px;background:#fff;box-shadow:0 18px 48px rgba(66,42,18,.12)}
                img{display:block;width:112px;margin:0 auto 20px}
                h1{margin:0 0 8px;text-align:center;font-size:1.6rem;color:#8f171d}
                p{margin:0 0 22px;text-align:center;line-height:1.6;color:#6e6a63}
                label{display:block;margin-bottom:8px;color:#174f35;font-weight:800}
                input{width:100%;height:48px;padding:0 14px;border:1px solid #e1d6c7;border-radius:10px;font-size:1rem}
                button{width:100%;height:50px;margin-top:16px;border:0;border-radius:999px;background:#9e111c;color:#fff;font-size:1rem;font-weight:800;cursor:pointer}
                a{display:block;margin-top:18px;text-align:center;color:#174f35;font-weight:800;text-decoration:none}
                .error{margin:0 0 16px;padding:11px 12px;border-radius:10px;background:#fff0f0;color:#9e111c;font-weight:800}
                .hint{margin-top:16px;margin-bottom:0;font-size:.88rem;color:#8a8175}
            </style>
        </head>
        <body>
            <main>
                <img src="/images/fresh-meat-logo-crop.png" alt="프레시미트">
                <h1>관리자 로그인</h1>
                <p>비밀번호를 입력하면 관리자 대시보드로 이동합니다.</p>
                ${errorMarkup}
                <form method="post" action="/admin/login">
                    <label for="password">관리자 비밀번호</label>
                    <input id="password" name="password" type="password" autocomplete="current-password" autofocus required>
                    <button type="submit">관리자 모드 들어가기</button>
                </form>
                <p class="hint">상점 화면에서 admin을 순서대로 입력해도 관리자 비밀번호 창이 열립니다.</p>
                <a href="/">상점으로 돌아가기</a>
            </main>
        </body>
        </html>
    `;
}

function requireAdmin(req, res, next) {
    if (req.session?.adminAuthenticated) return next();
    if (req.accepts('html')) {
        return res.redirect('/admin/login');
    }
    return res.status(401).json({ ok: false, message: '관리자 인증이 필요합니다.' });
}

function loginForm(req, res) {
    res.send(loginPageHtml());
}

async function login(req, res) {
    const { password } = req.body || {};
    const wantsJson = req.is('application/json');
    if (!(await verifyAdminPassword(password))) {
        if (wantsJson) {
            return res.status(401).json({ ok: false, message: '관리자 비밀번호가 맞지 않습니다.' });
        }
        return res.status(401).send(loginPageHtml('관리자 비밀번호가 맞지 않습니다.'));
    }
    req.session.adminAuthenticated = true;
    if (!wantsJson) {
        return res.redirect('/admin');
    }
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
    loginForm,
    login,
    logout,
    changePassword
};

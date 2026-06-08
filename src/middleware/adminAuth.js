const crypto = require('crypto');

const DEFAULT_ADMIN_PASSWORD = 'freshmeat2026!';

function getAdminPassword() {
    return process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
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

function login(req, res) {
    const { password } = req.body || {};
    if (!safeCompare(password, getAdminPassword())) {
        return res.status(401).json({ ok: false, message: '관리자 비밀번호가 맞지 않습니다.' });
    }
    req.session.adminAuthenticated = true;
    res.json({ ok: true, redirect: '/admin' });
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
    logout
};

const {
    generateAuthenticationOptions,
    generateRegistrationOptions,
    verifyAuthenticationResponse,
    verifyRegistrationResponse
} = require('@simplewebauthn/server');
const pool = require('../config/db');

const normalizePhone = phone => (phone || '').replace(/[^\d]/g, '');
const encode = value => Buffer.from(value).toString('base64url');
const decode = value => Buffer.from(value, 'base64url');

function getRp(req) {
    const host = req.hostname;
    const isLocalhost = host === 'localhost' || host === '127.0.0.1';
    return {
        rpName: '프레쉬 맛 마트',
        rpID: process.env.PASSKEY_RP_ID || host,
        origin: process.env.PASSKEY_ORIGIN || `${isLocalhost ? 'http' : req.protocol}://${req.get('host')}`
    };
}

async function ensurePasskeySchema() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS passkey_credentials (
            id INT AUTO_INCREMENT PRIMARY KEY,
            member_id INT NOT NULL,
            credential_id VARCHAR(255) NOT NULL UNIQUE,
            public_key TEXT NOT NULL,
            counter BIGINT DEFAULT 0,
            transports TEXT,
            device_type VARCHAR(50),
            backed_up BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_used_at TIMESTAMP NULL,
            INDEX idx_passkey_member_id (member_id),
            FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
        )
    `);
}

async function findMemberByPhone(phone) {
    const [rows] = await pool.query('SELECT * FROM members WHERE phone = ? LIMIT 1', [phone]);
    return rows[0];
}

async function createPasskeyMember({ name, phone }) {
    const username = `passkey-${phone.slice(-4)}-${Date.now().toString().slice(-5)}`;
    const [result] = await pool.query(
        `INSERT INTO members
         (username, password, name, phone, membership_type, preferred_meat, shopping_style,
          visit_time, marketing_agree, memo, points, tier, telegram_benefit_applied)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            username,
            'passkey-only',
            (name || '패스키 단골').trim(),
            phone,
            'basic',
            null,
            null,
            null,
            0,
            null,
            1000,
            '입석',
            0
        ]
    );
    return { id: result.insertId, name: (name || '패스키 단골').trim(), phone, username };
}

async function findOrCreateMember({ name, phone }) {
    const member = await findMemberByPhone(phone);
    if (member) return member;
    return createPasskeyMember({ name, phone });
}

async function findCredentialsByMember(memberId) {
    await ensurePasskeySchema();
    const [rows] = await pool.query(
        'SELECT * FROM passkey_credentials WHERE member_id = ? ORDER BY created_at DESC',
        [memberId]
    );
    return rows;
}

async function findCredentialById(credentialId) {
    await ensurePasskeySchema();
    const [rows] = await pool.query(
        `SELECT c.*, m.name, m.phone
         FROM passkey_credentials c
         JOIN members m ON m.id = c.member_id
         WHERE c.credential_id = ?
         LIMIT 1`,
        [credentialId]
    );
    return rows[0];
}

function toWebAuthnCredential(row) {
    return {
        id: row.credential_id,
        publicKey: decode(row.public_key),
        counter: Number(row.counter || 0),
        transports: row.transports ? JSON.parse(row.transports) : undefined
    };
}

function finishLogin(req, member) {
    req.session.member = {
        id: member.id || member.member_id,
        name: member.name,
        phone: member.phone
    };
}

exports.index = (req, res) => {
    res.render('client/passkey-login', {
        title: '패스키 로그인',
        layout: 'layout',
        member: req.session.member
    });
};

exports.authenticationOptions = async (req, res) => {
    try {
        await ensurePasskeySchema();
        const phone = normalizePhone(req.body.phone);
        if (phone.length < 10) {
            return res.status(400).json({ ok: false, message: '연락처를 입력해주세요.' });
        }

        const member = await findMemberByPhone(phone);
        const credentials = member ? await findCredentialsByMember(member.id) : [];
        if (!member || credentials.length === 0) {
            return res.json({ ok: true, needsRegistration: true });
        }

        const { rpID } = getRp(req);
        const options = await generateAuthenticationOptions({
            rpID,
            allowCredentials: credentials.map(credential => ({
                id: credential.credential_id,
                transports: credential.transports ? JSON.parse(credential.transports) : undefined
            })),
            userVerification: 'preferred'
        });

        req.session.passkeyChallenge = options.challenge;
        req.session.passkeyMemberId = member.id;
        res.json({ ok: true, needsRegistration: false, options });
    } catch (err) {
        console.error(err);
        res.status(500).json({ ok: false, message: '패스키 로그인 준비 중 오류가 발생했습니다.' });
    }
};

exports.verifyAuthentication = async (req, res) => {
    try {
        const credential = await findCredentialById(req.body.id);
        if (!credential) {
            return res.json({ ok: false, needsRegistration: true, message: '등록된 패스키가 없습니다.' });
        }

        const { rpID, origin } = getRp(req);
        const verification = await verifyAuthenticationResponse({
            response: req.body,
            expectedChallenge: req.session.passkeyChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
            credential: toWebAuthnCredential(credential),
            requireUserVerification: false
        });

        if (!verification.verified) {
            return res.status(400).json({ ok: false, message: '패스키 인증에 실패했습니다.' });
        }

        await pool.query(
            'UPDATE passkey_credentials SET counter = ?, last_used_at = CURRENT_TIMESTAMP WHERE credential_id = ?',
            [verification.authenticationInfo.newCounter, credential.credential_id]
        );
        await pool.query('UPDATE members SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [credential.member_id]);
        finishLogin(req, credential);
        res.json({ ok: true, redirect: '/passkey-login' });
    } catch (err) {
        console.error(err);
        res.status(400).json({ ok: false, message: '패스키 인증을 완료하지 못했습니다.' });
    }
};

exports.registrationOptions = async (req, res) => {
    try {
        const phone = normalizePhone(req.body.phone);
        if (phone.length < 10) {
            return res.status(400).json({ ok: false, message: '연락처를 입력해주세요.' });
        }

        const member = await findOrCreateMember({ name: req.body.name, phone });
        const credentials = await findCredentialsByMember(member.id);
        const { rpName, rpID } = getRp(req);
        const options = await generateRegistrationOptions({
            rpName,
            rpID,
            userID: Buffer.from(String(member.id)),
            userName: phone,
            userDisplayName: member.name || phone,
            excludeCredentials: credentials.map(credential => ({
                id: credential.credential_id,
                transports: credential.transports ? JSON.parse(credential.transports) : undefined
            })),
            authenticatorSelection: {
                residentKey: 'preferred',
                userVerification: 'preferred'
            },
            attestationType: 'none'
        });

        req.session.passkeyChallenge = options.challenge;
        req.session.passkeyMemberId = member.id;
        res.json({ ok: true, options });
    } catch (err) {
        console.error(err);
        res.status(500).json({ ok: false, message: '패스키 등록 준비 중 오류가 발생했습니다.' });
    }
};

exports.verifyRegistration = async (req, res) => {
    try {
        const memberId = req.session.passkeyMemberId;
        if (!memberId) {
            return res.status(400).json({ ok: false, message: '등록 세션이 만료되었습니다.' });
        }

        const { rpID, origin } = getRp(req);
        const verification = await verifyRegistrationResponse({
            response: req.body,
            expectedChallenge: req.session.passkeyChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
            requireUserVerification: false
        });

        if (!verification.verified) {
            return res.status(400).json({ ok: false, message: '패스키 등록에 실패했습니다.' });
        }

        const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
        await ensurePasskeySchema();
        await pool.query(
            `INSERT INTO passkey_credentials
             (member_id, credential_id, public_key, counter, transports, device_type, backed_up)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                public_key = VALUES(public_key),
                counter = VALUES(counter),
                transports = VALUES(transports),
                device_type = VALUES(device_type),
                backed_up = VALUES(backed_up)`,
            [
                memberId,
                credential.id,
                encode(credential.publicKey),
                credential.counter,
                JSON.stringify(credential.transports || []),
                credentialDeviceType,
                credentialBackedUp ? 1 : 0
            ]
        );

        const [members] = await pool.query('SELECT * FROM members WHERE id = ?', [memberId]);
        await pool.query('UPDATE members SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [memberId]);
        finishLogin(req, members[0]);
        res.json({ ok: true, redirect: '/passkey-login' });
    } catch (err) {
        console.error(err);
        res.status(400).json({ ok: false, message: '패스키 등록을 완료하지 못했습니다.' });
    }
};

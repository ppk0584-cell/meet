const pool = require('../config/db');

const ensureMemberColumns = async () => {
    const columns = [
        ['username', "ALTER TABLE members ADD COLUMN username VARCHAR(100)"],
        ['password', "ALTER TABLE members ADD COLUMN password VARCHAR(255)"],
        ['name', "ALTER TABLE members ADD COLUMN name VARCHAR(100)"],
        ['telegram_id', "ALTER TABLE members ADD COLUMN telegram_id VARCHAR(100)"],
        ['preferred_meat', "ALTER TABLE members ADD COLUMN preferred_meat VARCHAR(50)"],
        ['shopping_style', "ALTER TABLE members ADD COLUMN shopping_style VARCHAR(50)"],
        ['visit_time', "ALTER TABLE members ADD COLUMN visit_time VARCHAR(50)"],
        ['marketing_agree', "ALTER TABLE members ADD COLUMN marketing_agree BOOLEAN DEFAULT FALSE"],
        ['memo', "ALTER TABLE members ADD COLUMN memo TEXT"]
    ];

    for (const [column, statement] of columns) {
        const [rows] = await pool.query(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'members' AND COLUMN_NAME = ?`,
            [column]
        );
        if (rows.length === 0) {
            await pool.query(statement);
        }
    }
};

exports.registerForm = (req, res) => {
    res.render('client/membership/register', {
        title: '단골 회원 등록',
        layout: 'layout'
    });
};

exports.register = async (req, res) => {
    const {
        name,
        phone,
        telegram_id,
        membership_type,
        preferred_meat,
        shopping_style,
        visit_time,
        marketing_agree,
        memo
    } = req.body;

    const normalizedPhone = (phone || '').replace(/[^\d]/g, '');

    if (!name || normalizedPhone.length < 10) {
        return res.status(400).send('이름과 연락처를 확인해주세요.');
    }

    try {
        await ensureMemberColumns();

        const username = 'fresh-' + normalizedPhone.slice(-4) + '-' + Date.now().toString().slice(-5);
        const password = 'membership-only';
        const initialPoints = telegram_id ? 5000 : 1000;
        const telegramBenefitApplied = telegram_id ? 1 : 0;
        
        await pool.query(
            `INSERT INTO members
             (username, password, name, phone, telegram_id, membership_type, preferred_meat,
              shopping_style, visit_time, marketing_agree, memo, points, tier, telegram_benefit_applied)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                username,
                password,
                name.trim(),
                normalizedPhone,
                telegram_id || null,
                membership_type || 'basic',
                preferred_meat || null,
                shopping_style || null,
                visit_time || null,
                marketing_agree ? 1 : 0,
                memo || null,
                initialPoints,
                '입석',
                telegramBenefitApplied
            ]
        );

        res.redirect(`/membership/success?type=${encodeURIComponent(membership_type || 'basic')}&points=${initialPoints}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('단골 등록 중 오류가 발생했습니다.');
    }
};

exports.success = (req, res) => {
    res.render('client/membership/success', {
        title: '등록 완료',
        layout: 'layout',
        membershipType: req.query.type || 'basic',
        points: Number(req.query.points || 1000)
    });
};

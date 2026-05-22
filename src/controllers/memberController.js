const Member = require('../models/Member');
const pool = require('../config/db');

exports.list = async (req, res) => {
    try {
        const members = await Member.findAll();
        res.render('admin/members/list', {
            title: '멤버십 관리',
            layout: 'admin/layout',
            members
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.settings = async (req, res) => {
    try {
        const [settings] = await pool.query('SELECT * FROM membership_settings');
        res.render('admin/membership/settings', {
            title: '멤버십 혜택 설정',
            layout: 'admin/layout',
            settings
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const { settings } = req.body;
        // settings is an object with IDs as keys
        for (const id in settings) {
            const { discount_rate, reward_rate, monthly_fee, benefit_description } = settings[id];
            await pool.query(
                'UPDATE membership_settings SET discount_rate = ?, reward_rate = ?, monthly_fee = ?, benefit_description = ? WHERE id = ?',
                [discount_rate || 0, reward_rate || 0, monthly_fee || 0, benefit_description, id]
            );
        }
        res.redirect('/admin/membership/settings');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.applyBenefit = async (req, res) => {
    try {
        const { id } = req.params;
        await Member.applyTelegramBenefit(id);
        res.redirect('/admin/members');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

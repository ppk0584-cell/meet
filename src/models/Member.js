const pool = require('../config/db');

class Member {
    static async findAll() {
        const [rows] = await pool.query('SELECT * FROM members ORDER BY created_at DESC');
        return rows;
    }

    static async findById(id) {
        const [rows] = await pool.query('SELECT * FROM members WHERE id = ?', [id]);
        return rows[0];
    }

    static async findByTelegramId(telegramId) {
        const [rows] = await pool.query('SELECT * FROM members WHERE telegram_id = ?', [telegramId]);
        return rows[0];
    }

    static async updateTierAndPoints(id, tier, points) {
        await pool.query('UPDATE members SET tier = ?, points = ? WHERE id = ?', [tier, points, id]);
    }

    // Logic for Telegram Benefit
    static async applyTelegramBenefit(id) {
        const member = await this.findById(id);
        if (member && !member.telegram_benefit_applied) {
            // Give 5000 points and upgrade tier to '입석' if it's new
            const newPoints = member.points + 5000;
            const newTier = member.tier === '신규' ? '입석' : member.tier;
            await pool.query(
                'UPDATE members SET points = ?, tier = ?, telegram_benefit_applied = 1 WHERE id = ?',
                [newPoints, newTier, id]
            );
            return true;
        }
        return false;
    }
}

module.exports = Member;

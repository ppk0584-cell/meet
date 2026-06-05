const pool = require('../config/db');

class ManagedFile {
    static async ensureSchema() {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS managed_files (
                id INT AUTO_INCREMENT PRIMARY KEY,
                original_name VARCHAR(255) NOT NULL,
                stored_name VARCHAR(255) NOT NULL UNIQUE,
                source_url VARCHAR(1000),
                mime_type VARCHAR(150),
                size_bytes BIGINT DEFAULT 0,
                note TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
    }

    static async findAll() {
        await this.ensureSchema();
        const [rows] = await pool.query('SELECT * FROM managed_files ORDER BY created_at DESC, id DESC');
        return rows;
    }

    static async findById(id) {
        await this.ensureSchema();
        const [rows] = await pool.query('SELECT * FROM managed_files WHERE id = ?', [id]);
        return rows[0];
    }

    static async create(fileData) {
        await this.ensureSchema();
        const [result] = await pool.query(
            `INSERT INTO managed_files
                (original_name, stored_name, source_url, mime_type, size_bytes, note)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                fileData.original_name,
                fileData.stored_name,
                fileData.source_url || null,
                fileData.mime_type || null,
                fileData.size_bytes || 0,
                fileData.note || null
            ]
        );
        return result.insertId;
    }

    static async delete(id) {
        await this.ensureSchema();
        await pool.query('DELETE FROM managed_files WHERE id = ?', [id]);
    }
}

module.exports = ManagedFile;

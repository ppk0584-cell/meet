const pool = require('../config/db');

class Recipe {
    static samplePlatingImages() {
        return [
            'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=85',
            'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=900&q=85',
            'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=900&q=85',
            'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=900&q=85',
            'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=85'
        ];
    }

    static async ensureTable() {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS product_recipes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT NOT NULL,
                recipe_title VARCHAR(255) NOT NULL,
                ingredients TEXT,
                cooking_steps TEXT,
                video_url VARCHAR(500),
                plating_image_url VARCHAR(500),
                sort_order INT DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_product_recipes_product_id (product_id),
                CONSTRAINT fk_product_recipes_product
                    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            )
        `);
        await this.addColumnIfMissing('recipe_title', 'VARCHAR(255) NOT NULL DEFAULT "기본 레시피"');
        await this.addColumnIfMissing('ingredients', 'TEXT');
        await this.addColumnIfMissing('cooking_steps', 'TEXT');
        await this.addColumnIfMissing('video_url', 'VARCHAR(500)');
        await this.addColumnIfMissing('plating_image_url', 'VARCHAR(500)');
        await this.addColumnIfMissing('sort_order', 'INT DEFAULT 0');
        await this.addColumnIfMissing('is_active', 'BOOLEAN DEFAULT TRUE');
        await this.fillSamplePlatingImages();
    }

    static async fillSamplePlatingImages() {
        const images = this.samplePlatingImages();
        const [rows] = await pool.query(
            `SELECT id FROM product_recipes
             WHERE plating_image_url IS NULL OR plating_image_url = ''
             ORDER BY id ASC`
        );
        for (const [index, row] of rows.entries()) {
            await pool.query(
                'UPDATE product_recipes SET plating_image_url = ? WHERE id = ?',
                [images[index % images.length], row.id]
            );
        }
    }

    static async addColumnIfMissing(column, definition) {
        const [rows] = await pool.query(
            `SELECT COUNT(*) AS count
             FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_recipes' AND COLUMN_NAME = ?`,
            [column]
        );
        if (!rows[0].count) {
            await pool.query(`ALTER TABLE product_recipes ADD COLUMN ${column} ${definition}`);
        }
    }

    static async findProduct(productId) {
        const [rows] = await pool.query(
            'SELECT id, name, trace_number, description FROM products WHERE id = ?',
            [productId]
        );
        return rows[0];
    }

    static async findAllByProductId(productId, { includeInactive = false } = {}) {
        await this.ensureTable();
        const activeSql = includeInactive ? '' : 'AND is_active = 1';
        const [rows] = await pool.query(
            `SELECT * FROM product_recipes
             WHERE product_id = ? ${activeSql}
             ORDER BY sort_order ASC, id ASC`,
            [productId]
        );
        return rows;
    }

    static async create(productId, recipeData) {
        await this.ensureTable();
        const { recipe_title, ingredients, cooking_steps, video_url, plating_image_url, sort_order, is_active } = recipeData;
        const [result] = await pool.query(
            `INSERT INTO product_recipes
                (product_id, recipe_title, ingredients, cooking_steps, video_url, plating_image_url, sort_order, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                productId,
                recipe_title,
                ingredients || '',
                cooking_steps || '',
                video_url || '',
                plating_image_url || '',
                Number(sort_order || 0),
                is_active ? 1 : 0
            ]
        );
        return result.insertId;
    }

    static async delete(id) {
        await this.ensureTable();
        await pool.query('DELETE FROM product_recipes WHERE id = ?', [id]);
    }
}

module.exports = Recipe;

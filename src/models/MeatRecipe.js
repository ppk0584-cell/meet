const pool = require('../config/db');

const MEAT_TYPES = {
    beef: '소고기',
    pork: '돼지고기',
    chicken: '닭고기',
    lamb: '양고기',
    duck: '오리고기',
    mixed: '혼합/세트'
};

const SECTION_TYPES = {
    boss_pick: '사장추천',
    situation: '상황별 추천',
    cooking_use: '요리용도',
    family_table: '가족식탁',
    camping: '캠핑',
    guest_table: '손님상',
    grill_ai: 'AI 굽기'
};

const DEFAULT_RECIPES = [
    {
        meat_type: 'beef',
        menu_name: '팬시어링 등심 스테이크',
        ingredients: '등심 300g\n소금 3g\n후추 약간\n버터 20g\n마늘 3쪽\n로즈마리 1줄기',
        cooking_steps: '1. 고기를 실온에 20분 둡니다.\n2. 소금과 후추로 밑간합니다.\n3. 강한 불에서 앞뒤를 굽고 버터, 마늘, 로즈마리로 끼얹어 마무리합니다.\n4. 5분 레스팅 후 썰어 냅니다.',
        video_url: 'https://www.youtube.com/results?search_query=%EB%93%B1%EC%8B%AC+%EC%8A%A4%ED%85%8C%EC%9D%B4%ED%81%AC+%EA%B5%BD%EB%8A%94%EB%B2%95',
        image_url: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=900&q=85',
        sections: ['cooking_use', 'guest_table', 'grill_ai'],
        difficulty: '보통',
        cooking_time_minutes: 25,
        serving_count: 2,
        tags: '스테이크,손님상,팬시어링'
    },
    {
        meat_type: 'pork',
        menu_name: '캠핑 삼겹살 바비큐',
        ingredients: '삼겹살 600g\n소금 약간\n쌈채소\n마늘\n고추\n쌈장',
        cooking_steps: '1. 그릴을 충분히 예열합니다.\n2. 삼겹살을 올리고 하단 테두리 갈변을 확인합니다.\n3. 가장자리 육즙이 올라오면 뒤집습니다.\n4. 먹기 좋은 크기로 잘라 한 번 더 노릇하게 굽습니다.',
        video_url: 'https://www.youtube.com/results?search_query=%EC%BA%A0%ED%95%91+%EC%82%BC%EA%B2%B9%EC%82%B4+%EA%B5%BD%EB%8A%94%EB%B2%95',
        image_url: 'https://images.pexels.com/photos/18824006/pexels-photo-18824006.jpeg?auto=compress&cs=tinysrgb&w=900',
        sections: ['camping', 'grill_ai', 'situation'],
        difficulty: '쉬움',
        cooking_time_minutes: 20,
        serving_count: 3,
        tags: '캠핑,삼겹살,그릴'
    },
    {
        meat_type: 'beef',
        menu_name: '든든한 집밥 소불고기',
        ingredients: '불고기용 소고기 500g\n양파 1개\n대파 1대\n간장 5큰술\n설탕 2큰술\n다진 마늘 1큰술\n참기름 1큰술',
        cooking_steps: '1. 양념을 섞어 고기에 20분 재웁니다.\n2. 팬에 양파와 대파를 먼저 볶습니다.\n3. 고기를 넣고 센 불에서 빠르게 익힙니다.\n4. 국물이 살짝 남을 때 불을 끕니다.',
        video_url: 'https://www.youtube.com/results?search_query=%EC%86%8C%EB%B6%88%EA%B3%A0%EA%B8%B0+%EB%A0%88%EC%8B%9C%ED%94%BC',
        image_url: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=900&q=85',
        sections: ['family_table', 'situation', 'cooking_use'],
        difficulty: '쉬움',
        cooking_time_minutes: 30,
        serving_count: 4,
        tags: '집밥,불고기,가족식탁'
    }
];

class MeatRecipe {
    static meatTypes() {
        return MEAT_TYPES;
    }

    static sectionTypes() {
        return SECTION_TYPES;
    }

    static async ensureSchema() {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS meat_recipe_catalog (
                id INT AUTO_INCREMENT PRIMARY KEY,
                meat_type VARCHAR(50) NOT NULL,
                menu_name VARCHAR(255) NOT NULL,
                ingredients TEXT,
                cooking_steps TEXT,
                video_url VARCHAR(500),
                image_url VARCHAR(500),
                difficulty VARCHAR(50),
                cooking_time_minutes INT DEFAULT 0,
                serving_count INT DEFAULT 1,
                tags VARCHAR(500),
                creator_name VARCHAR(255),
                restaurant_name VARCHAR(255),
                source_name VARCHAR(255),
                source_url VARCHAR(500),
                memo TEXT,
                sort_order INT DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_meat_recipe_type (meat_type),
                INDEX idx_meat_recipe_active (is_active)
            )
        `);
        await this.addColumnIfMissing('creator_name', 'VARCHAR(255)');
        await this.addColumnIfMissing('restaurant_name', 'VARCHAR(255)');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS meat_recipe_sections (
                recipe_id INT NOT NULL,
                section_code VARCHAR(80) NOT NULL,
                PRIMARY KEY (recipe_id, section_code),
                INDEX idx_meat_recipe_section (section_code),
                FOREIGN KEY (recipe_id) REFERENCES meat_recipe_catalog(id) ON DELETE CASCADE
            )
        `);
        await this.seedDefaults();
        await this.activateDefaultRecipesIfNeeded();
    }

    static normalizeSections(sections) {
        const values = Array.isArray(sections) ? sections : sections ? [sections] : [];
        return [...new Set(values.filter(section => SECTION_TYPES[section]))];
    }

    static async seedDefaults() {
        const [rows] = await pool.query('SELECT COUNT(*) AS count FROM meat_recipe_catalog');
        if (rows[0].count) return;
        for (const recipe of DEFAULT_RECIPES) {
            await this.create(recipe);
        }
    }

    static async addColumnIfMissing(column, definition) {
        const [rows] = await pool.query(
            `SELECT COUNT(*) AS count
             FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meat_recipe_catalog' AND COLUMN_NAME = ?`,
            [column]
        );
        if (!rows[0].count) {
            await pool.query(`ALTER TABLE meat_recipe_catalog ADD COLUMN ${column} ${definition}`);
        }
    }

    static async create(data) {
        await this.ensureTablesOnly();
        const sections = this.normalizeSections(data.sections || data.section_codes);
        const [result] = await pool.query(
            `INSERT INTO meat_recipe_catalog
                (meat_type, menu_name, ingredients, cooking_steps, video_url, image_url,
                 difficulty, cooking_time_minutes, serving_count, tags, creator_name, restaurant_name, source_name, source_url,
                 memo, sort_order, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.meat_type || 'mixed',
                data.menu_name,
                data.ingredients || '',
                data.cooking_steps || '',
                data.video_url || '',
                data.image_url || '',
                data.difficulty || '',
                Number(data.cooking_time_minutes || 0),
                Number(data.serving_count || 1),
                data.tags || '',
                data.creator_name || '',
                data.restaurant_name || '',
                data.source_name || '',
                data.source_url || '',
                data.memo || '',
                Number(data.sort_order || 0),
                data.is_active === undefined ? 1 : data.is_active ? 1 : 0
            ]
        );
        await this.replaceSections(result.insertId, sections);
        return result.insertId;
    }

    static async ensureTablesOnly() {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS meat_recipe_catalog (
                id INT AUTO_INCREMENT PRIMARY KEY,
                meat_type VARCHAR(50) NOT NULL,
                menu_name VARCHAR(255) NOT NULL,
                ingredients TEXT,
                cooking_steps TEXT,
                video_url VARCHAR(500),
                image_url VARCHAR(500),
                difficulty VARCHAR(50),
                cooking_time_minutes INT DEFAULT 0,
                serving_count INT DEFAULT 1,
                tags VARCHAR(500),
                creator_name VARCHAR(255),
                restaurant_name VARCHAR(255),
                source_name VARCHAR(255),
                source_url VARCHAR(500),
                memo TEXT,
                sort_order INT DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS meat_recipe_sections (
                recipe_id INT NOT NULL,
                section_code VARCHAR(80) NOT NULL,
                PRIMARY KEY (recipe_id, section_code),
                FOREIGN KEY (recipe_id) REFERENCES meat_recipe_catalog(id) ON DELETE CASCADE
            )
        `);
    }

    static async replaceSections(recipeId, sections) {
        await pool.query('DELETE FROM meat_recipe_sections WHERE recipe_id = ?', [recipeId]);
        for (const section of sections) {
            await pool.query(
                'INSERT IGNORE INTO meat_recipe_sections (recipe_id, section_code) VALUES (?, ?)',
                [recipeId, section]
            );
        }
    }

    static async activateDefaultRecipesIfNeeded() {
        const [activeRows] = await pool.query('SELECT COUNT(*) AS count FROM meat_recipe_catalog WHERE is_active = 1');
        if (activeRows[0].count) return;
        const names = DEFAULT_RECIPES.map(recipe => recipe.menu_name);
        if (!names.length) return;
        await pool.query(
            `UPDATE meat_recipe_catalog
             SET is_active = 1
             WHERE menu_name IN (${names.map(() => '?').join(',')})`,
            names
        );
    }

    static async findAll({ includeInactive = false } = {}) {
        await this.ensureSchema();
        const activeSql = includeInactive ? '' : 'WHERE r.is_active = 1';
        const [rows] = await pool.query(`
            SELECT r.*,
                   GROUP_CONCAT(s.section_code ORDER BY s.section_code SEPARATOR ',') AS section_codes
            FROM meat_recipe_catalog r
            LEFT JOIN meat_recipe_sections s ON s.recipe_id = r.id
            ${activeSql}
            GROUP BY r.id
            ORDER BY r.sort_order ASC, r.id DESC
        `);
        return rows.map(row => ({
            ...row,
            section_codes: row.section_codes ? row.section_codes.split(',') : []
        }));
    }

    static async delete(id) {
        await this.ensureSchema();
        await pool.query('DELETE FROM meat_recipe_catalog WHERE id = ?', [id]);
    }
}

module.exports = MeatRecipe;

const pool = require('../config/db');

const CATEGORY_GROUPS = {
    menu_section: {
        boss_pick: '사장추천 / 특가',
        situation: '상황별 추천',
        cooking_use: '요리용도',
        family_table: '가족식탁'
    },
    boss_pick_type: {
        recommend: '추천상품',
        sale: '특가상품'
    },
    meat_type: {
        beef: '소고기',
        pork: '돼지고기',
        chicken: '닭고기',
        etc: '세트'
    },
    situation: {
        party: '홈파티',
        home_meal: '집밥',
        late_night: '야식',
        camping: '캠핑'
    },
    cooking_use: {
        grill: '구이용',
        soup_stew: '국·찌개용',
        stir_fry_bulgogi: '볶음·불고기용',
        braise: '찜·조림용',
        boil_bossam_jangjorim: '수육·보쌈·장조림용'
    },
    family_table: {
        happy_table: '가족행복 식탁',
        kids_safe: '아이 안심 반찬',
        parents_care: '부모님 보양',
        wellness_diet: '웰빙/다이어트',
        mixed: '혼합용'
    }
};

const DEFAULT_PRODUCTS = [
    { name: '오전에 들어온 신선한 뭉티기', meat: 'beef', menu: ['boss_pick'], boss_pick_type: ['recommend'], price: 15000, description: '당일 입고 한우를 얇게 손질한 인기 메뉴', trace: 'HT-2026-001', image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=700&q=80' },
    { name: '딱 5팩 남은 한우 특수부위', meat: 'beef', menu: ['boss_pick'], boss_pick_type: ['sale'], price: 25000, description: '소량 입고되는 구이용 한정 부위', trace: 'HT-2026-002', image: 'https://images.unsplash.com/photo-1551028150-64b9f398f678?auto=format&fit=crop&w=700&q=80' },
    { name: '실속형 돼지 구이팩', meat: 'pork', menu: ['boss_pick'], boss_pick_type: ['sale'], price: 8000, description: '모양은 달라도 맛과 신선도는 그대로', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=700&q=80' },
    { name: '춘천식 닭갈비 밀키트', meat: 'chicken', menu: ['boss_pick'], boss_pick_type: ['recommend'], price: 12000, description: '소스와 손질 닭고기가 함께 들어간 간편 세트', image: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=700&q=80' },
    { name: '티본 스테이크 홈파티 세트', meat: 'beef', menu: ['situation'], situation: ['party'], price: 45000, description: '버터, 로즈마리, 시즈닝 포함', image: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=700&q=80' },
    { name: '든든한 집밥 불고기', meat: 'beef', menu: ['situation'], situation: ['home_meal'], price: 18000, description: '반찬 걱정 없는 양념 불고기 세트', image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=700&q=80' },
    { name: '육사시미 야식 세트', meat: 'beef', menu: ['situation'], situation: ['late_night'], price: 22000, description: '술안주로 좋은 신선 특화 상품', image: 'https://images.unsplash.com/photo-1615937657715-bc7b4b7962c1?auto=format&fit=crop&w=700&q=80' },
    { name: '캠핑용 두툼한 목살', meat: 'pork', menu: ['situation'], situation: ['camping'], price: 15000, description: '숯불 바비큐에 맞춘 두께 손질', image: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=700&q=80' },
    { name: '가족행복 한상 불고기팩', meat: 'beef', menu: ['family_table'], family_table: ['happy_table'], price: 18000, description: '온 가족이 함께 먹기 좋은 부드러운 양념 불고기', image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=700&q=80' },
    { name: '아이 안심 반찬 다짐육', meat: 'beef', menu: ['family_table'], family_table: ['kids_safe'], price: 12000, description: '아이 반찬과 볶음밥에 쓰기 좋은 곱게 손질한 고기', image: 'https://images.unsplash.com/photo-1553163147-622ab57be1c7?auto=format&fit=crop&w=700&q=80' },
    { name: '부모님 보양 숙성육 세트', meat: 'beef', menu: ['family_table'], family_table: ['parents_care'], price: 35000, description: '어르신들이 드시기 좋은 부드러운 숙성육 구성', image: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=700&q=80' },
    { name: '웰빙 닭가슴살 식단팩', meat: 'chicken', menu: ['family_table'], family_table: ['wellness_diet'], price: 7000, description: '식단 관리에 좋은 저지방 단백질 소포장', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=700&q=80' },
    { name: '혼합용 소량 모듬팩', meat: 'etc', menu: ['family_table'], family_table: ['mixed'], price: 10000, description: '찌개, 볶음, 구이를 조금씩 준비하는 실속 구성', image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=700&q=80' },
    { name: '구이용 한우 등심 컷', meat: 'beef', menu: ['cooking_use'], cooking_use: ['grill'], price: 32000, description: '불판에서 육즙이 잘 살아나는 두께로 손질', trace: 'HT-2026-014', image: 'https://images.unsplash.com/photo-1551028150-64b9f398f678?auto=format&fit=crop&w=700&q=80' },
    { name: '국·찌개용 양지 소분팩', meat: 'beef', menu: ['cooking_use'], cooking_use: ['soup_stew'], price: 16000, description: '국물 맛을 깊게 내기 좋은 부위만 소포장', trace: 'HT-2026-015', image: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&w=700&q=80' },
    { name: '볶음·불고기용 앞다리살', meat: 'pork', menu: ['cooking_use'], cooking_use: ['stir_fry_bulgogi'], price: 11000, description: '양념이 잘 배도록 얇고 고르게 슬라이스', image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=700&q=80' },
    { name: '찜·조림용 돼지갈비', meat: 'pork', menu: ['cooking_use'], cooking_use: ['braise'], price: 14000, description: '갈비찜과 간장조림에 맞춘 정육 손질', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=700&q=80' },
    { name: '수육·보쌈·장조림용 사태', meat: 'beef', menu: ['cooking_use'], cooking_use: ['boil_bossam_jangjorim'], price: 19000, description: '오래 익혀도 결이 부드럽고 담백한 실속 부위', trace: 'HT-2026-018', image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=700&q=80' }
];

class Product {
    static categoryGroups() {
        return CATEGORY_GROUPS;
    }

    static async ensureCatalogSchema() {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(100),
                part VARCHAR(100),
                grade VARCHAR(50),
                origin VARCHAR(100) DEFAULT '국내산',
                price_per_100g INT NOT NULL DEFAULT 0,
                stock_quantity DECIMAL(10, 2) DEFAULT 0,
                slaughter_date DATE,
                trace_number VARCHAR(50),
                usage_category VARCHAR(100),
                tags TEXT,
                description TEXT,
                image_url VARCHAR(500),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS product_display_categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT NOT NULL,
                group_code VARCHAR(80) NOT NULL,
                category_code VARCHAR(100) NOT NULL,
                sort_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uniq_product_display_category (product_id, group_code, category_code),
                INDEX idx_display_group_category (group_code, category_code),
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            )
        `);
        await this.addColumnIfMissing('products', 'image_url', 'VARCHAR(500)');
        await this.addColumnIfMissing('products', 'is_active', 'BOOLEAN DEFAULT TRUE');
        await this.addColumnIfMissing('products', 'price_regular', 'INT');
        await this.addColumnIfMissing('products', 'price_basic_member', 'INT');
        await this.addColumnIfMissing('products', 'price_prepaid_member', 'INT');
        await this.addColumnIfMissing('products', 'price_subscription_member', 'INT');
        await this.backfillBossPickTypes();
    }

    static async addColumnIfMissing(table, column, definition) {
        const [rows] = await pool.query(
            `SELECT COUNT(*) AS count
             FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
            [table, column]
        );
        if (!rows[0].count) {
            await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
        }
    }

    static async backfillBossPickTypes() {
        await pool.query(`
            INSERT IGNORE INTO product_display_categories (product_id, group_code, category_code, sort_order)
            SELECT
                p.id,
                'boss_pick_type',
                CASE
                    WHEN p.name REGEXP '특가|할인|실속|한정|딱[[:space:]]*[0-9]+' THEN 'sale'
                    ELSE 'recommend'
                END,
                50
            FROM products p
            JOIN product_display_categories menu
                ON menu.product_id = p.id
                AND menu.group_code = 'menu_section'
                AND menu.category_code = 'boss_pick'
            LEFT JOIN product_display_categories label
                ON label.product_id = p.id
                AND label.group_code = 'boss_pick_type'
            WHERE label.id IS NULL
        `);
    }

    static async seedDefaultCatalogIfEmpty() {
        await this.ensureCatalogSchema();
        const [rows] = await pool.query('SELECT COUNT(*) AS count FROM products');
        if (rows[0].count > 0) return;

        for (const item of DEFAULT_PRODUCTS) {
            const productId = await this.create({
                name: item.name,
                category: CATEGORY_GROUPS.meat_type[item.meat],
                price_per_100g: item.price,
                stock_quantity: 10,
                trace_number: item.trace || '',
                description: item.description,
                image_url: item.image,
                menu_sections: item.menu,
                boss_pick_types: item.boss_pick_type || [],
                meat_types: [item.meat],
                situations: item.situation || [],
                cooking_uses: item.cooking_use || [],
                family_tables: item.family_table || []
            });
            await this.seedDefaultRecipe(productId, item);
        }
    }

    static async seedDefaultRecipe(productId, item) {
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
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            )
        `);
        await pool.query(
            `INSERT INTO product_recipes (product_id, recipe_title, ingredients, cooking_steps, video_url, plating_image_url, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                productId,
                `${item.name} 기본 레시피`,
                '고기 300g\n소금 약간\n후추 약간\n마늘 또는 대파 약간',
                '1. 고기를 키친타월로 눌러 핏물을 가볍게 제거합니다.\n2. 조리 20분 전 실온에 두고 소금, 후추로 밑간합니다.\n3. 팬이나 냄비를 충분히 예열한 뒤 용도에 맞게 조리합니다.\n4. 완성 후 3분 정도 두었다가 먹기 좋게 담아냅니다.',
                '',
                item.image,
                0
            ]
        );
    }

    static async findAll() {
        await this.ensureCatalogSchema();
        const [products] = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
        const ids = products.map(product => product.id);
        const categoryMap = await this.findCategoryMap(ids);
        return products.map(product => ({
            ...product,
            display_categories: categoryMap[product.id] || {}
        }));
    }

    static async findByUsage(usage) {
        await this.ensureCatalogSchema();
        const [rows] = await pool.query(
            `SELECT p.* FROM products p
             JOIN product_display_categories c ON c.product_id = p.id
             WHERE c.group_code = 'menu_section' AND c.category_code = ? AND p.is_active = 1
             ORDER BY c.sort_order ASC, p.created_at DESC`,
            [usage]
        );
        return rows;
    }

    static async findCatalogProducts() {
        await this.seedDefaultCatalogIfEmpty();
        const [products] = await pool.query('SELECT * FROM products WHERE is_active = 1 ORDER BY created_at ASC, id ASC');
        const ids = products.map(product => product.id);
        const categoryMap = await this.findCategoryMap(ids);
        return products.map(product => this.toCatalogProduct(product, categoryMap[product.id] || {}));
    }

    static async findCategoryMap(productIds) {
        if (!productIds.length) return {};
        const [rows] = await pool.query(
            `SELECT product_id, group_code, category_code, sort_order
             FROM product_display_categories
             WHERE product_id IN (?) ORDER BY sort_order ASC, id ASC`,
            [productIds]
        );
        return rows.reduce((map, row) => {
            map[row.product_id] ||= {};
            map[row.product_id][row.group_code] ||= [];
            map[row.product_id][row.group_code].push(row.category_code);
            return map;
        }, {});
    }

    static toCatalogProduct(product, categories) {
        const meatType = categories.meat_type?.[0] || this.normalizeMeatType(product.category);
        return {
            id: product.id,
            name: product.name,
            category: meatType,
            price: product.price_regular || product.price_per_100g || 0,
            member_prices: {
                regular: product.price_regular || product.price_per_100g || 0,
                basic: product.price_basic_member,
                prepaid: product.price_prepaid_member,
                subscription: product.price_subscription_member
            },
            description: product.description || '',
            trace_number: product.trace_number,
            image_url: product.image_url || '/images/fresh-meat-logo.png',
            boss_pick_type: categories.boss_pick_type?.[0] || null,
            display_categories: categories
        };
    }

    static normalizeMeatType(category = '') {
        if (category.includes('소') || category.toLowerCase() === 'beef') return 'beef';
        if (category.includes('돼') || category.toLowerCase() === 'pork') return 'pork';
        if (category.includes('닭') || category.toLowerCase() === 'chicken') return 'chicken';
        return 'etc';
    }

    static inferBossPickType(productData) {
        return /특가|할인|실속|한정|딱\s*\d+/.test(productData.name || '') ? 'sale' : 'recommend';
    }

    static async findById(id) {
        await this.ensureCatalogSchema();
        const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
        return rows[0];
    }

    static async create(productData) {
        await this.ensureCatalogSchema();
        const { name, category, part, grade, origin, price_per_100g, stock_quantity, slaughter_date, trace_number, description, image_url } = productData;
        const regularPrice = productData.price_regular || price_per_100g;
        const [result] = await pool.query(
            `INSERT INTO products
                (name, category, part, grade, origin, price_per_100g, price_regular, price_basic_member, price_prepaid_member, price_subscription_member, stock_quantity, slaughter_date, trace_number, description, image_url)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name,
                category,
                part,
                grade,
                origin || '국내산',
                regularPrice,
                regularPrice,
                productData.price_basic_member || null,
                productData.price_prepaid_member || null,
                productData.price_subscription_member || null,
                stock_quantity || 0,
                slaughter_date || null,
                trace_number,
                description,
                image_url
            ]
        );
        await this.replaceDisplayCategories(result.insertId, productData);
        return result.insertId;
    }

    static async update(id, productData) {
        await this.ensureCatalogSchema();
        const { name, category, part, grade, origin, price_per_100g, stock_quantity, slaughter_date, trace_number, description, image_url } = productData;
        const regularPrice = productData.price_regular || price_per_100g;
        await pool.query(
            `UPDATE products
             SET name=?, category=?, part=?, grade=?, origin=?, price_per_100g=?, price_regular=?, price_basic_member=?, price_prepaid_member=?, price_subscription_member=?, stock_quantity=?, slaughter_date=?, trace_number=?, description=?, image_url=?
             WHERE id=?`,
            [
                name,
                category,
                part,
                grade,
                origin,
                regularPrice,
                regularPrice,
                productData.price_basic_member || null,
                productData.price_prepaid_member || null,
                productData.price_subscription_member || null,
                stock_quantity,
                slaughter_date || null,
                trace_number,
                description,
                image_url,
                id
            ]
        );
        await this.replaceDisplayCategories(id, productData);
    }

    static categoryInput(productData, name) {
        const value = productData[name];
        if (!value) return [];
        return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
    }

    static async replaceDisplayCategories(productId, productData) {
        await pool.query('DELETE FROM product_display_categories WHERE product_id = ?', [productId]);
        const menuSections = this.categoryInput(productData, 'menu_sections');
        const bossPickTypes = this.categoryInput(productData, 'boss_pick_types');
        const assignments = [
            ...menuSections.map(category => ['menu_section', category]),
            ...bossPickTypes.map(category => ['boss_pick_type', category]),
            ...this.categoryInput(productData, 'meat_types').map(category => ['meat_type', category]),
            ...this.categoryInput(productData, 'situations').map(category => ['situation', category]),
            ...this.categoryInput(productData, 'cooking_uses').map(category => ['cooking_use', category]),
            ...this.categoryInput(productData, 'family_tables').map(category => ['family_table', category])
        ];
        if (menuSections.includes('boss_pick') && !bossPickTypes.length) {
            assignments.push(['boss_pick_type', this.inferBossPickType(productData)]);
        }
        if (!assignments.some(([group]) => group === 'meat_type')) {
            assignments.push(['meat_type', this.normalizeMeatType(productData.category)]);
        }
        for (const [index, [group, category]] of assignments.entries()) {
            await pool.query(
                `INSERT IGNORE INTO product_display_categories
                    (product_id, group_code, category_code, sort_order)
                 VALUES (?, ?, ?, ?)`,
                [productId, group, category, index]
            );
        }
    }

    static async delete(id) {
        await pool.query('DELETE FROM products WHERE id = ?', [id]);
    }
}

module.exports = Product;

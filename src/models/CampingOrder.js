const crypto = require('crypto');
const pool = require('../config/db');

const SEEDED_CAMPGROUNDS = [
    {
        name: '초안산캠핑장',
        address: '서울특별시 노원구 마들로5가길 66-107',
        phone: '02-2289-6865'
    },
    {
        name: '자라섬 캠핑장',
        address: '경기도 가평군 가평읍 자라섬로 60',
        phone: '031-8078-8028'
    },
    {
        name: '난지캠핑장',
        address: '서울특별시 마포구 한강난지로 28',
        phone: '02-373-2021'
    },
    {
        name: '안산화랑오토캠핑장',
        address: '경기도 안산시 단원구 동산로 268',
        phone: '031-481-9800'
    },
    {
        name: '연천 한탄강 오토캠핑장',
        address: '경기도 연천군 전곡읍 선사로 76',
        phone: '031-833-0030'
    },
    {
        name: '강화도산들애농원 캠핑장',
        address: '인천광역시 강화군 강화읍 고비고개로 171',
        phone: ''
    },
    {
        name: '송도스포츠캠핑장',
        address: '인천광역시 연수구 인천신항대로892번길 40',
        phone: '032-899-4888'
    },
    {
        name: '마글램핑장',
        address: '부산광역시 강서구 가락대로 929',
        phone: ''
    },
    {
        name: '삼락생태공원 오토캠핑장',
        address: '부산광역시 사상구 삼락동 29-59',
        phone: '051-313-6015'
    },
    {
        name: '달서별빛캠프 캠핑장',
        address: '대구광역시 달서구 앞산순환로 248',
        phone: '053-667-3191'
    },
    {
        name: '승촌보캠핑장',
        address: '광주광역시 남구 승촌보길 90',
        phone: '062-603-5340'
    },
    {
        name: '로하스가족공원캠핑장',
        address: '대전광역시 대덕구 대청로424번길 200',
        phone: '042-933-6575'
    },
    {
        name: '대왕암공원 캠핑장',
        address: '울산광역시 동구 등대로 140',
        phone: '052-209-4530'
    },
    {
        name: '세종합강캠핑장',
        address: '세종특별자치시 연동면 태산로 329',
        phone: '044-850-1117'
    },
    {
        name: '망상오토캠핑리조트',
        address: '강원특별자치도 동해시 동해대로 6370',
        phone: '033-539-3600'
    },
    {
        name: '평창오렌지캠핑장',
        address: '강원특별자치도 평창군 봉평면 흥정계곡4길 71',
        phone: ''
    },
    {
        name: '영월계곡 느티별 캠핑장',
        address: '강원특별자치도 영월군 김삿갓면 내리계곡로 1106',
        phone: ''
    },
    {
        name: '속초해변 국민여가캠핑장',
        address: '강원특별자치도 속초시 해오름로 190',
        phone: '033-639-2027'
    },
    {
        name: '충주탄금호캠핑장',
        address: '충청북도 충주시 중앙탑면 중앙탑길 150',
        phone: '043-850-6732'
    },
    {
        name: '청풍호오토캠핑장',
        address: '충청북도 제천시 청풍면 청풍호로 2048',
        phone: ''
    },
    {
        name: 'CLUB 596',
        address: '충청남도 태안군 남면 몽산리 596',
        phone: ''
    },
    {
        name: '당진해양캠핑공원',
        address: '충청남도 당진시 신평면 산정길 112',
        phone: ''
    },
    {
        name: '국립중앙청소년수련원 야영장',
        address: '충청남도 천안시 동남구 목천읍 서리4길 48',
        phone: '041-620-7700'
    },
    {
        name: '금강 두승산 글램핑',
        address: '전북특별자치도 정읍시 고부면 영원로 222-15',
        phone: ''
    },
    {
        name: '무주구천동캠핑장',
        address: '전북특별자치도 무주군 설천면 구천동로 1048-26',
        phone: ''
    },
    {
        name: '변산반도국립공원 고사포야영장',
        address: '전북특별자치도 부안군 변산면 노루목길 8-8',
        phone: '063-582-7808'
    },
    {
        name: '순천만국가정원 오토캠핑장',
        address: '전라남도 순천시 국가정원1호길 162-11',
        phone: '061-749-5500'
    },
    {
        name: '장흥 심천공원 오토캠핑장',
        address: '전라남도 장흥군 부산면 심천공원길 25-45',
        phone: ''
    },
    {
        name: '동재가산수피아',
        address: '경상북도 칠곡군 가산면 학하리 1206-1',
        phone: '054-979-6088'
    },
    {
        name: '칠곡보 오토캠핑장',
        address: '경상북도 칠곡군 약목면 강변서로 110-43',
        phone: ''
    },
    {
        name: '문경새재 국민여가캠핑장',
        address: '경상북도 문경시 문경읍 새재1길 47',
        phone: '054-572-3762'
    },
    {
        name: '북캠프지오',
        address: '경상남도 거제시 남부면 명사해수욕장길 30',
        phone: ''
    },
    {
        name: '함양대봉캠핑랜드',
        address: '경상남도 함양군 병곡면 병곡지곡로 331',
        phone: '055-963-2026'
    },
    {
        name: '황매산오토캠핑장',
        address: '경상남도 합천군 가회면 황매산공원길 331',
        phone: '055-930-4753'
    },
    {
        name: '서귀포자연휴양림야영장',
        address: '제주특별자치도 서귀포시 1100로 882',
        phone: '064-738-4544'
    },
    {
        name: '교래자연휴양림 야영장',
        address: '제주특별자치도 제주시 조천읍 남조로 2023',
        phone: '064-783-7482'
    }
];

const HOLIDAY_NAMES = {
    '2026-01-01': '신정',
    '2026-02-16': '설 연휴',
    '2026-02-17': '설날',
    '2026-02-18': '설 연휴',
    '2026-03-01': '삼일절',
    '2026-03-02': '삼일절 대체공휴일',
    '2026-05-05': '어린이날',
    '2026-05-24': '부처님오신날',
    '2026-05-25': '부처님오신날 대체공휴일',
    '2026-06-06': '현충일',
    '2026-08-15': '광복절',
    '2026-08-17': '광복절 대체공휴일',
    '2026-09-24': '추석 연휴',
    '2026-09-25': '추석',
    '2026-09-26': '추석 연휴',
    '2026-10-03': '개천절',
    '2026-10-05': '개천절 대체공휴일',
    '2026-10-09': '한글날',
    '2026-12-25': '성탄절',
    '2027-01-01': '신정',
    '2027-02-06': '설 연휴',
    '2027-02-07': '설날',
    '2027-02-08': '설 연휴',
    '2027-02-09': '설 대체공휴일',
    '2027-03-01': '삼일절',
    '2027-05-05': '어린이날',
    '2027-05-13': '부처님오신날',
    '2027-06-06': '현충일',
    '2027-08-15': '광복절',
    '2027-08-16': '광복절 대체공휴일',
    '2027-09-14': '추석 연휴',
    '2027-09-15': '추석',
    '2027-09-16': '추석 연휴',
    '2027-10-03': '개천절',
    '2027-10-04': '개천절 대체공휴일',
    '2027-10-09': '한글날',
    '2027-10-11': '한글날 대체공휴일',
    '2027-12-25': '성탄절',
    '2028-01-01': '신정',
    '2028-01-26': '설 연휴',
    '2028-01-27': '설날',
    '2028-01-28': '설 연휴',
    '2028-03-01': '삼일절',
    '2028-05-02': '부처님오신날',
    '2028-05-05': '어린이날',
    '2028-06-06': '현충일',
    '2028-08-15': '광복절',
    '2028-10-02': '추석 연휴',
    '2028-10-03': '추석',
    '2028-10-04': '추석 연휴',
    '2028-10-05': '개천절 대체공휴일',
    '2028-10-09': '한글날',
    '2028-12-25': '성탄절'
};

function clean(value) {
    return String(value || '').trim();
}

function parseYmd(value) {
    const match = clean(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

function isHolidayPeriod(dateValue) {
    const date = parseYmd(dateValue);
    if (!date) return { warning: false, reason: '' };

    const ymd = clean(dateValue);
    if (date.getUTCDay() === 0) {
        return {
            warning: true,
            reason: '수령희망일이 일요일입니다. 다음날 택배 도착 특성상 캠핑장 수령이 어려울 수 있어 배송지 수령을 권장합니다.'
        };
    }

    if (HOLIDAY_NAMES[ymd]) {
        return {
            warning: true,
            reason: `수령희망일이 ${HOLIDAY_NAMES[ymd]}입니다. 연휴 기간에는 캠핑장 배송보다 배송지 수령 후 이동을 권장합니다.`
        };
    }

    return { warning: false, reason: '' };
}

class CampingOrder {
    static async ensureSchema() {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS camping_delivery_locations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                address VARCHAR(500) NOT NULL,
                phone VARCHAR(50),
                memo TEXT,
                use_count INT DEFAULT 0,
                last_used_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uniq_camping_location (name, address)
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS camping_orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_number VARCHAR(40) NOT NULL UNIQUE,
                customer_name VARCHAR(100) NOT NULL,
                customer_phone VARCHAR(30) NOT NULL,
                customer_email VARCHAR(150),
                set_name VARCHAR(120) NOT NULL DEFAULT '캠핑준비 주문하면 끝',
                people_count INT DEFAULT 4,
                quantity INT DEFAULT 1,
                requested_receive_date DATE NOT NULL,
                destination_type ENUM('campground', 'home') NOT NULL,
                campground_location_id INT,
                campground_name VARCHAR(255),
                delivery_address VARCHAR(500) NOT NULL,
                delivery_detail VARCHAR(255),
                package_options TEXT,
                customer_memo TEXT,
                holiday_warning BOOLEAN DEFAULT FALSE,
                holiday_warning_reason VARCHAR(500),
                verification_status ENUM('pending', 'confirmed', 'need_check', 'cancelled') DEFAULT 'pending',
                seller_memo TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_camping_orders_date (requested_receive_date),
                INDEX idx_camping_orders_status (verification_status),
                FOREIGN KEY (campground_location_id) REFERENCES camping_delivery_locations(id) ON DELETE SET NULL
            )
        `);

        await this.addColumnIfMissing('camping_orders', 'address_confirmed', 'BOOLEAN DEFAULT FALSE');
        await this.seedCampgrounds();
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

    static async seedCampgrounds() {
        for (const campground of SEEDED_CAMPGROUNDS) {
            await pool.query(
                `INSERT IGNORE INTO camping_delivery_locations (name, address, phone)
                 VALUES (?, ?, ?)`,
                [campground.name, campground.address, campground.phone]
            );
        }
    }

    static async findCampgrounds() {
        await this.ensureSchema();
        const [rows] = await pool.query(`
            SELECT id, name, address, phone
            FROM camping_delivery_locations
            ORDER BY use_count DESC, name ASC
        `);
        return rows;
    }

    static async findOrCreateCampground({ name, address }) {
        const campgroundName = clean(name);
        const campgroundAddress = clean(address);
        if (!campgroundName || !campgroundAddress) return null;

        await pool.query(
            `INSERT IGNORE INTO camping_delivery_locations (name, address)
             VALUES (?, ?)`,
            [campgroundName, campgroundAddress]
        );
        const [rows] = await pool.query(
            `SELECT id FROM camping_delivery_locations
             WHERE name = ? AND address = ?
             LIMIT 1`,
            [campgroundName, campgroundAddress]
        );
        const location = rows[0] || null;
        if (location) {
            await pool.query(
                `UPDATE camping_delivery_locations
                 SET use_count = use_count + 1, last_used_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [location.id]
            );
        }
        return location;
    }

    static buildOrderNumber() {
        const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        return `CAMP-${stamp}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    }

    static async create(data) {
        await this.ensureSchema();

        const destinationType = clean(data.destination_type) === 'home' ? 'home' : 'campground';
        const requestedDate = clean(data.requested_receive_date);
        const warning = isHolidayPeriod(requestedDate);
        const campgroundName = destinationType === 'campground' ? clean(data.campground_name) : '';
        const address = destinationType === 'campground' ? clean(data.campground_address) : clean(data.home_address);
        const campground = destinationType === 'campground'
            ? await this.findOrCreateCampground({ name: campgroundName, address })
            : null;
        const packageOptions = Array.isArray(data.package_options)
            ? data.package_options.join(', ')
            : clean(data.package_options);

        const [result] = await pool.query(
            `INSERT INTO camping_orders
                (order_number, customer_name, customer_phone, customer_email, people_count, quantity,
                 requested_receive_date, destination_type, campground_location_id, campground_name,
                 delivery_address, delivery_detail, package_options, customer_memo,
                 holiday_warning, holiday_warning_reason, verification_status, address_confirmed)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                this.buildOrderNumber(),
                clean(data.customer_name),
                clean(data.customer_phone),
                clean(data.customer_email),
                Number(data.people_count || 4),
                Number(data.quantity || 1),
                requestedDate,
                destinationType,
                campground ? campground.id : null,
                campgroundName || null,
                address,
                clean(data.delivery_detail),
                packageOptions,
                clean(data.customer_memo),
                warning.warning,
                warning.reason,
                warning.warning ? 'need_check' : 'pending',
                destinationType === 'campground' && clean(data.campground_address_confirm) === 'yes'
            ]
        );

        return this.findById(result.insertId);
    }

    static validate(data) {
        const errors = [];
        if (!clean(data.customer_name)) errors.push('주문자 이름을 입력해주세요.');
        if (!clean(data.customer_phone)) errors.push('연락처를 입력해주세요.');
        if (!clean(data.requested_receive_date)) errors.push('수령희망일자를 선택해주세요.');
        if (clean(data.destination_type) === 'home') {
            if (!clean(data.home_address)) errors.push('배송지 주소를 입력해주세요.');
        } else {
            if (!clean(data.campground_name)) errors.push('캠핑장 이름을 입력해주세요.');
            if (!clean(data.campground_address)) errors.push('캠핑장 주소를 입력해주세요.');
            if (clean(data.campground_address_confirm) !== 'yes') {
                errors.push('캠핑장 주소 확인 및 오배송 책임 안내에 동의해주세요.');
            }
        }
        return errors;
    }

    static async findById(id) {
        const [rows] = await pool.query('SELECT * FROM camping_orders WHERE id = ?', [id]);
        return rows[0];
    }

    static async findByOrderNumber(orderNumber) {
        await this.ensureSchema();
        const [rows] = await pool.query('SELECT * FROM camping_orders WHERE order_number = ?', [orderNumber]);
        return rows[0];
    }

    static async findAll() {
        await this.ensureSchema();
        const [rows] = await pool.query(`
            SELECT *
            FROM camping_orders
            ORDER BY requested_receive_date ASC, created_at DESC
        `);
        return rows;
    }

    static holidayNotice(dateValue) {
        return isHolidayPeriod(dateValue);
    }
}

module.exports = CampingOrder;

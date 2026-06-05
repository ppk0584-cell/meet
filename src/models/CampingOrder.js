const crypto = require('crypto');
const pool = require('../config/db');

const SEEDED_CAMPGROUNDS = [
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
        name: '망상오토캠핑리조트',
        address: '강원특별자치도 동해시 동해대로 6370',
        phone: '033-539-3600'
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
            reason: '수령희망일이 일요일입니다. 다음날 택배 도착 특성상 캠핑장 수령이 어려울 수 있어 거주지 수령을 권장합니다.'
        };
    }

    if (HOLIDAY_NAMES[ymd]) {
        return {
            warning: true,
            reason: `수령희망일이 ${HOLIDAY_NAMES[ymd]}입니다. 연휴 기간에는 캠핑장 배송보다 거주지 수령 후 이동을 권장합니다.`
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

        await this.seedCampgrounds();
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
                 holiday_warning, holiday_warning_reason, verification_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
                warning.warning ? 'need_check' : 'pending'
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
            if (!clean(data.home_address)) errors.push('거주지 수령 주소를 입력해주세요.');
        } else {
            if (!clean(data.campground_name)) errors.push('캠핑장 이름을 입력해주세요.');
            if (!clean(data.campground_address)) errors.push('캠핑장 주소를 입력해주세요.');
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

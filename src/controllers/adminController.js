const pool = require('../config/db');
const Product = require('../models/Product');
const ManagedFile = require('../models/ManagedFile');
const MeatRecipe = require('../models/MeatRecipe');
const CampingOrder = require('../models/CampingOrder');

async function countTable(table, where = '1=1') {
    try {
        const [rows] = await pool.query(`SELECT COUNT(*) AS count FROM ${table} WHERE ${where}`);
        return Number(rows[0]?.count || 0);
    } catch (err) {
        return 0;
    }
}

exports.index = async (req, res) => {
    try {
        await Product.ensureCatalogSchema();
        await ManagedFile.ensureSchema();
        await MeatRecipe.ensureSchema();
        await CampingOrder.ensureSchema();

        const stats = {
            products: await countTable('products', 'is_active = 1'),
            todayOrders: await countTable('camping_orders', 'DATE(created_at) = CURDATE()'),
            members: await countTable('members'),
            recipes: await countTable('meat_recipe_catalog', 'is_active = 1'),
            files: await countTable('managed_files')
        };

        const [recentProducts] = await pool.query(
            `SELECT name, category, stock_quantity, updated_at
             FROM products
             ORDER BY updated_at DESC, id DESC
             LIMIT 5`
        );

        const [recentOrders] = await pool.query(
            `SELECT order_number, customer_name, people_count, quantity, verification_status, created_at
             FROM camping_orders
             ORDER BY created_at DESC, id DESC
             LIMIT 5`
        );

        res.render('admin/dashboard', {
            title: '관리자 대시보드 요약',
            layout: 'admin/layout',
            stats,
            recentProducts,
            recentOrders
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

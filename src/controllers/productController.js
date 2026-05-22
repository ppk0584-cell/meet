const Product = require('../models/Product');

exports.list = async (req, res) => {
    try {
        const products = await Product.findAll();
        res.render('admin/products/list', {
            title: '상품 관리',
            layout: 'admin/layout',
            products
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.addForm = (req, res) => {
    res.render('admin/products/add', {
        title: '신규 상품 등록',
        layout: 'admin/layout',
        categoryGroups: Product.categoryGroups()
    });
};

exports.create = async (req, res) => {
    try {
        await Product.create(req.body);
        res.redirect('/admin/products');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

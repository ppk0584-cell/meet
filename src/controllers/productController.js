const Product = require('../models/Product');

function normalizeProductData(body) {
    const meatTypes = Array.isArray(body.meat_types) ? body.meat_types : body.meat_types ? [body.meat_types] : [];
    const meatLabel = {
        beef: '소고기',
        pork: '돼지고기',
        chicken: '닭고기',
        etc: '기타'
    };
    return {
        ...body,
        meat_types: meatTypes,
        category: body.category || meatLabel[meatTypes[0]] || '기타'
    };
}

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
        categoryGroups: Product.categoryGroups(),
        product: null,
        action: '/admin/products/add',
        submitLabel: '등록하기'
    });
};

exports.create = async (req, res) => {
    try {
        await Product.create(normalizeProductData(req.body));
        res.redirect('/admin/products');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.editForm = async (req, res) => {
    try {
        const products = await Product.findAll();
        const product = products.find(item => Number(item.id) === Number(req.params.id));
        if (!product) return res.status(404).send('상품을 찾을 수 없습니다.');

        res.render('admin/products/add', {
            title: '상품 수정',
            layout: 'admin/layout',
            categoryGroups: Product.categoryGroups(),
            product,
            action: `/admin/products/edit/${product.id}`,
            submitLabel: '수정 저장'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.update = async (req, res) => {
    try {
        await Product.update(req.params.id, normalizeProductData(req.body));
        res.redirect('/admin/products');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.delete = async (req, res) => {
    try {
        await Product.delete(req.params.id);
        res.redirect('/admin/products');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

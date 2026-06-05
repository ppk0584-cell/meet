const CampingOrder = require('../models/CampingOrder');

exports.create = async (req, res) => {
    try {
        const errors = CampingOrder.validate(req.body);
        if (errors.length) {
            return res.status(400).render('client/camping-order-success', {
                title: '캠핑 주문 확인',
                layout: 'layout',
                order: null,
                errors
            });
        }

        const order = await CampingOrder.create(req.body);
        res.redirect(`/camping-orders/${order.order_number}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.success = async (req, res) => {
    try {
        const order = await CampingOrder.findByOrderNumber(req.params.orderNumber);
        if (!order) return res.status(404).send('Order not found');

        res.render('client/camping-order-success', {
            title: '캠핑 주문 접수 완료',
            layout: 'layout',
            order,
            errors: []
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.adminList = async (req, res) => {
    try {
        const orders = await CampingOrder.findAll();
        res.render('admin/camping-orders/list', {
            title: '캠핑 주문 확인',
            layout: 'admin/layout',
            orders
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

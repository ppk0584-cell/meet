const Recipe = require('../models/Recipe');

exports.show = async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await Recipe.findProduct(productId);
        if (!product) {
            return res.status(404).send('상품을 찾을 수 없습니다.');
        }
        const recipes = await Recipe.findAllByProductId(productId);

        res.render('client/recipe', {
            title: `${product.name} 레시피`,
            layout: 'layout',
            product,
            recipes
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.adminList = async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await Recipe.findProduct(productId);
        if (!product) {
            return res.status(404).send('상품을 찾을 수 없습니다.');
        }
        const recipes = await Recipe.findAllByProductId(productId, { includeInactive: true });

        res.render('admin/products/recipes', {
            title: '상품 레시피 관리',
            layout: 'admin/layout',
            product,
            recipes
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.adminCreate = async (req, res) => {
    try {
        const { productId } = req.params;
        await Recipe.create(productId, req.body);
        res.redirect(`/admin/products/${productId}/recipes`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.adminDelete = async (req, res) => {
    try {
        const { productId, recipeId } = req.params;
        await Recipe.delete(recipeId);
        res.redirect(`/admin/products/${productId}/recipes`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

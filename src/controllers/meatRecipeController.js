const MeatRecipe = require('../models/MeatRecipe');

exports.index = async (req, res) => {
    try {
        const recipes = await MeatRecipe.findAll();
        res.render('client/meat-recipes/index', {
            title: '고기 요리 레시피',
            layout: 'layout',
            recipes,
            meatTypes: MeatRecipe.meatTypes(),
            sectionTypes: MeatRecipe.sectionTypes()
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.adminList = async (req, res) => {
    try {
        const recipes = await MeatRecipe.findAll({ includeInactive: true });
        res.render('admin/recipes/list', {
            title: '고기 요리 레시피 DB',
            layout: 'admin/layout',
            recipes,
            meatTypes: MeatRecipe.meatTypes(),
            sectionTypes: MeatRecipe.sectionTypes()
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.adminCreate = async (req, res) => {
    try {
        await MeatRecipe.create(req.body);
        res.redirect('/admin/recipes');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.adminDelete = async (req, res) => {
    try {
        await MeatRecipe.delete(req.params.recipeId);
        res.redirect('/admin/recipes');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

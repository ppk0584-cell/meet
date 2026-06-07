const Product = require('../models/Product');
const CampingOrder = require('../models/CampingOrder');

function cloneForSection(product, extra = {}) {
    return {
        ...product,
        ...extra
    };
}

function sectionItems(products, menuCode, subGroup, subField) {
    return products.flatMap(product => {
        const menus = product.display_categories.menu_section || [];
        if (!menus.includes(menuCode)) return [];
        if (!subGroup) {
            return [cloneForSection(product, {
                usage_category: menuCode,
                boss_pick_type: product.display_categories.boss_pick_type?.[0] || product.boss_pick_type
            })];
        }

        const subCategories = product.display_categories[subGroup] || [];
        return subCategories.map(category => cloneForSection(product, {
            usage_category: menuCode,
            [subField]: category
        }));
    });
}

exports.list = async (req, res) => {
    try {
        const products = await Product.findCatalogProducts();
        const campgrounds = await CampingOrder.findCampgrounds();
        const bossPicks = sectionItems(products, 'boss_pick');
        const homeParty = sectionItems(products, 'situation', 'situation', 'theme_category')
            .filter(product => product.theme_category !== 'camping');
        const cookingUse = sectionItems(products, 'cooking_use', 'cooking_use', 'cooking_category');
        const family = sectionItems(products, 'family_table', 'family_table', 'family_category');

        const pork = products.filter(p => p.category === 'pork');
        const beef = products.filter(p => p.category === 'beef');
        const chicken = products.filter(p => p.category === 'chicken');
        const etc = products.filter(p => p.category === 'etc');

        res.render('client/products/index', {
            title: '상품 둘러보기',
            layout: 'layout',
            sections: { bossPicks, homeParty, family, cookingUse },
            types: { pork, beef, chicken, etc },
            campgrounds
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

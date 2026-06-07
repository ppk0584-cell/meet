const Product = require('../models/Product');
const CampingOrder = require('../models/CampingOrder');
const MeatRecipe = require('../models/MeatRecipe');

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

function textOf(recipe) {
    return `${recipe.menu_name || ''} ${recipe.tags || ''} ${recipe.ingredients || ''}`.toLowerCase();
}

function cookingCategory(recipe) {
    const text = textOf(recipe);
    if (text.includes('갈비찜') || text.includes('조림') || text.includes('braise')) return 'braise';
    if (text.includes('수육') || text.includes('보쌈') || text.includes('장조림')) return 'boil_bossam_jangjorim';
    if (text.includes('찌개') || text.includes('국') || text.includes('stew') || text.includes('soup')) return 'soup_stew';
    if (text.includes('불고기') || text.includes('볶음') || text.includes('bulgogi')) return 'stir_fry_bulgogi';
    return 'grill';
}

function themeCategory(recipe) {
    const codes = recipe.section_codes || [];
    const text = textOf(recipe);
    if (codes.includes('guest_table') || text.includes('손님') || text.includes('파티') || text.includes('스테이크')) return 'party';
    if (text.includes('야식') || text.includes('술안주')) return 'late_night';
    return 'home_meal';
}

function familyCategory(recipe) {
    const text = textOf(recipe);
    if (text.includes('아이') || text.includes('반찬')) return 'kids_safe';
    if (text.includes('부모') || text.includes('보양')) return 'parents_care';
    if (text.includes('다이어트') || text.includes('식단') || text.includes('닭가슴살')) return 'wellness_diet';
    if (text.includes('혼합') || text.includes('모듬')) return 'mixed';
    return 'happy_table';
}

function cloneRecipeForSection(recipe, extra = {}) {
    return {
        ...recipe,
        ...extra
    };
}

function recipeSectionItems(recipes) {
    const result = {
        bossPicks: [],
        situation: [],
        cookingUse: [],
        family: [],
        camping: []
    };

    recipes.forEach(recipe => {
        const codes = recipe.section_codes || [];
        if (codes.includes('boss_pick')) {
            result.bossPicks.push(cloneRecipeForSection(recipe, { recipe_section_label: '사장추천' }));
        }
        if (codes.includes('situation') || codes.includes('guest_table')) {
            result.situation.push(cloneRecipeForSection(recipe, {
                theme_category: themeCategory(recipe),
                recipe_section_label: codes.includes('guest_table') ? '손님상' : '상황별 추천'
            }));
        }
        if (codes.includes('cooking_use') || codes.includes('grill_ai')) {
            result.cookingUse.push(cloneRecipeForSection(recipe, {
                cooking_category: cookingCategory(recipe),
                recipe_section_label: codes.includes('grill_ai') ? 'AI 굽기' : '요리용도'
            }));
        }
        if (codes.includes('family_table')) {
            result.family.push(cloneRecipeForSection(recipe, {
                family_category: familyCategory(recipe),
                recipe_section_label: '가족식탁'
            }));
        }
        if (codes.includes('camping')) {
            result.camping.push(cloneRecipeForSection(recipe, { recipe_section_label: '캠핑 레시피' }));
        }
    });

    return result;
}

exports.list = async (req, res) => {
    try {
        const products = await Product.findCatalogProducts();
        const campgrounds = await CampingOrder.findCampgrounds();
        const meatRecipes = await MeatRecipe.findAll();
        const recipeSections = recipeSectionItems(meatRecipes);
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
            sections: { bossPicks, homeParty, family, cookingUse, recipeSections },
            types: { pork, beef, chicken, etc },
            campgrounds,
            meatTypes: MeatRecipe.meatTypes(),
            recipeSectionTypes: MeatRecipe.sectionTypes()
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

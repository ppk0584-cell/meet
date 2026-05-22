const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const productController = require('../controllers/productController');
const memberController = require('../controllers/memberController');
const recipeController = require('../controllers/recipeController');
const multer = require('multer');
const path = require('path');

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, 'meat-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

router.get('/', adminController.index);

// Product Management
router.get('/products', productController.list);
router.get('/products/add', productController.addForm);
router.post('/products/add', productController.create);
router.get('/products/:productId/recipes', recipeController.adminList);
router.post('/products/:productId/recipes', recipeController.adminCreate);
router.post('/products/:productId/recipes/:recipeId/delete', recipeController.adminDelete);

// Membership Management
router.get('/members', memberController.list);
router.post('/members/benefit/:id', memberController.applyBenefit);
router.get('/membership/settings', memberController.settings);
router.post('/membership/settings', memberController.updateSettings);

module.exports = router;

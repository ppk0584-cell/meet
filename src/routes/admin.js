const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const productController = require('../controllers/productController');
const memberController = require('../controllers/memberController');
const recipeController = require('../controllers/recipeController');
const meatRecipeController = require('../controllers/meatRecipeController');
const fileController = require('../controllers/fileController');
const campingOrderController = require('../controllers/campingOrderController');
const multer = require('multer');
const path = require('path');
const adminAuth = require('../middleware/adminAuth');

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
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, fileController.storageDir);
    },
    filename: (req, file, cb) => {
        cb(null, fileController.uniqueStoredName(file.originalname));
    }
});
const fileUpload = multer({
    storage: fileStorage,
    limits: { fileSize: 50 * 1024 * 1024 }
});

router.post('/login', adminAuth.login);
router.get('/logout', adminAuth.logout);
router.use(adminAuth.requireAdmin);

router.get('/', adminController.index);

// Product Management
router.get('/products', productController.list);
router.get('/products/add', productController.addForm);
router.post('/products/add', productController.create);
router.get('/products/edit/:id', productController.editForm);
router.post('/products/edit/:id', productController.update);
router.post('/products/delete/:id', productController.delete);
router.get('/products/:productId/recipes', recipeController.adminList);
router.post('/products/:productId/recipes', recipeController.adminCreate);
router.post('/products/:productId/recipes/:recipeId/delete', recipeController.adminDelete);
router.get('/recipes', meatRecipeController.adminList);
router.post('/recipes', meatRecipeController.adminCreate);
router.post('/recipes/:recipeId/delete', meatRecipeController.adminDelete);

// Membership Management
router.get('/members', memberController.list);
router.post('/members/benefit/:id', memberController.applyBenefit);
router.get('/membership/settings', memberController.settings);
router.post('/membership/settings', memberController.updateSettings);

// Order Management
router.get('/orders', campingOrderController.adminList);

// File Management
router.get('/files', fileController.list);
router.post('/files/upload', fileUpload.single('managed_file'), fileController.upload);
router.post('/files/download-url', fileController.downloadFromUrl);
router.get('/files/:id/download', fileController.download);
router.post('/files/:id/delete', fileController.remove);

module.exports = router;

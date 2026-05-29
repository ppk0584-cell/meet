const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// View engine setup
app.set('trust proxy', 1);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout'); // Default layout for client side

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'freshmatmall-passkey-session',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: 'auto',
        maxAge: 1000 * 60 * 60 * 4
    }
}));
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Routes
const indexRouter = require('./routes/index');
const adminRouter = require('./routes/admin');
const aiController = require('./controllers/aiController');
const recipeController = require('./controllers/recipeController');
const customerController = require('./controllers/customerController');
const passkeyController = require('./controllers/passkeyController');
const shopController = require('./controllers/shopController');
const multer = require('multer');

// Multer Storage Configuration (for client-side AI analysis)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, 'meat-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });
const cameraUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024 }
});

app.get('/ping', (req, res) => res.send('pong'));
app.use('/', indexRouter);
app.get('/products', shopController.list);
app.get('/ai-analysis', aiController.index);
app.post('/ai-analysis/analyze', upload.single('meatImage'), aiController.analyze);
app.post('/ai-analysis/analyze-camera', cameraUpload.single('meatImage'), aiController.analyzeCamera);
app.get('/product/recipe/:productId', recipeController.show);

// Membership Routes
app.get('/membership/register', customerController.registerForm);
app.post('/membership/register', customerController.register);
app.get('/membership/success', customerController.success);
app.get('/passkey-login', passkeyController.index);
app.post('/passkeys/authentication/options', passkeyController.authenticationOptions);
app.post('/passkeys/authentication/verify', passkeyController.verifyAuthentication);
app.post('/passkeys/registration/options', passkeyController.registrationOptions);
app.post('/passkeys/registration/verify', passkeyController.verifyRegistration);

app.use('/admin', adminRouter);

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const orderFileController = require('../controllers/orderFileController');
const authMiddleware = require('../middleware/authMiddleware');

const uploadDir = path.join(__dirname, '..', 'uploads', 'orders');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');

        const uniqueName =
            Date.now() +
            '-' +
            Math.round(Math.random() * 1e9) +
            path.extname(originalName);

        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 300 * 1024 * 1024
    }
});

router.get(
    '/:orderId',
    authMiddleware,
    orderFileController.getOrderFiles
);

router.post(
    '/:orderId',
    authMiddleware,
    upload.single('file'),
    orderFileController.uploadOrderFile
);

router.delete(
    '/file/:fileId',
    authMiddleware,
    orderFileController.deleteOrderFile
);

module.exports = router;
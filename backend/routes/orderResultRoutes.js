const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const orderResultController = require('../controllers/orderResultController');
const authMiddleware = require('../middleware/authMiddleware');

const uploadDir = path.join(__dirname, '..', 'uploads', 'order-results');

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
        fileSize: 500 * 1024 * 1024
    }
});

router.get(
    '/file/:fileId/download',
    authMiddleware,
    orderResultController.downloadResultFile
);

router.delete(
    '/file/:fileId',
    authMiddleware,
    orderResultController.deleteResultFile
);

router.get(
    '/:orderId',
    authMiddleware,
    orderResultController.getResultFiles
);

router.post(
    '/:orderId',
    authMiddleware,
    upload.single('file'),
    orderResultController.uploadResultFile
);

module.exports = router;
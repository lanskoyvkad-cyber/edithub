const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

const uploadDir = path.join(__dirname, '..', 'uploads', 'chats');

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
        fileSize: 100 * 1024 * 1024
    }
});

router.post('/', authMiddleware, chatController.createChat);

router.get('/', authMiddleware, chatController.getMyChats);

router.patch('/:chatId/read', authMiddleware, chatController.markChatAsRead);

router.get('/:chatId/messages', authMiddleware, chatController.getMessagesByChat);

router.post('/:chatId/messages', authMiddleware, chatController.sendMessage);

router.post(
    '/:chatId/files',
    authMiddleware,
    upload.single('file'),
    chatController.sendFileMessage
);

module.exports = router;
const express = require('express');

const router = express.Router();

const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      message: 'Доступ запрещён. Требуются права администратора'
    });
  }

  next();
};

router.get('/', authMiddleware, adminOnly, userController.getUsers);

router.get('/stats', authMiddleware, adminOnly, userController.getAdminStats);

router.put('/profile', authMiddleware, userController.updateProfile);
router.get('/editors', userController.getEditors);
router.get('/editor/:id', userController.getEditorProfile);

router.patch('/:id/role', authMiddleware, adminOnly, userController.updateUserRole);

router.delete('/:id', authMiddleware, adminOnly, userController.deleteUser);

module.exports = router;
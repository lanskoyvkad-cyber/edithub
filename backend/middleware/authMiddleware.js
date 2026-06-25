const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: 'Нет токена авторизации'
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        message: 'Токен не передан'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await pool.query(
      `
      SELECT 
        user_id,
        email,
        role,
        full_name,
        is_blocked
      FROM users
      WHERE user_id = $1
      `,
      [decoded.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: 'Пользователь не найден'
      });
    }

    const user = result.rows[0];

    if (user.is_blocked) {
      return res.status(403).json({
        message: 'Ваш аккаунт заблокирован администратором'
      });
    }

    req.user = user;

    next();

  } catch (error) {
    console.error(error);

    return res.status(401).json({
      message: 'Неверный или просроченный токен'
    });
  }
};

module.exports = authMiddleware;
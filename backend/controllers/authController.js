const pool = require('../config/db');
const bcrypt = require('bcrypt');

exports.register = async (req, res) => {
    try {

        const {
            email,
            password,
            role,
            full_name,
            city
        } = req.body;

        // Проверка существующего пользователя
        const existingUser = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                message: 'Пользователь уже существует'
            });
        }

        // Хеширование пароля
        const hashedPassword =
            await bcrypt.hash(password, 10);

        // Создание пользователя
        const result = await pool.query(
            `
            INSERT INTO users
            (
                email,
                password,
                role,
                full_name,
                city
            )
            VALUES
            (
                $1,$2,$3,$4,$5
            )
            RETURNING
                user_id,
                email,
                role,
                full_name,
                city,
                created_at
            `,
            [
                email,
                hashedPassword,
                role,
                full_name,
                city
            ]
        );

        res.status(201).json({
            message: 'Пользователь успешно зарегистрирован',
            user: result.rows[0]
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Ошибка сервера'
        });
    }
};

const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Пользователь не найден'
            });
        }

        const user = result.rows[0];

        if (user.is_blocked) {
            return res.status(403).json({
                message: 'Ваш аккаунт заблокирован администратором'
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                message: 'Неверный пароль'
            });
        }

        const token = jwt.sign(
            {
                user_id: user.user_id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '24h'
            }
        );

        res.json({
            message: 'Авторизация успешна',
            token,
            user: {
                user_id: user.user_id,
                email: user.email,
                role: user.role,
                full_name: user.full_name,
                city: user.city
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Ошибка сервера'
        });
    }
};

exports.me = async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT 
                user_id,
                email,
                role,
                full_name,
                city,
                avatar,
                created_at
            FROM users
            WHERE user_id = $1
            `,
            [req.user.user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Пользователь не найден'
            });
        }

        res.json({
            user: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Ошибка сервера'
        });
    }
};
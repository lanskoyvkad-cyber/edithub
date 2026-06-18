const pool = require('../config/db');

exports.createOrder = async (req, res) => {
    try {
        const { title, description, budget, deadline, video_type } = req.body;

        const result = await pool.query(
            `
            INSERT INTO orders
            (user_id, title, description, budget, deadline, video_type)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
            `,
            [
                req.user.user_id,
                title,
                description,
                budget,
                deadline,
                video_type
            ]
        );

        res.status(201).json({
            message: 'Заказ успешно создан',
            order: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Ошибка при создании заказа'
        });
    }
};

exports.getOrders = async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT 
                o.*,
                u.full_name AS client_name,
                u.city AS client_city
            FROM orders o
            JOIN users u ON o.user_id = u.user_id
            ORDER BY o.created_at DESC
            `
        );

        res.json({
            orders: result.rows
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Ошибка при получении заказов'
        });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT 
                o.*,
                u.full_name AS client_name,
                u.city AS client_city
            FROM orders o
            JOIN users u ON o.user_id = u.user_id
            WHERE o.order_id = $1
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Заказ не найден'
            });
        }

        res.json({
            order: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Ошибка при получении заказа'
        });
    }
};

exports.getMyOrders = async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT
                o.*,
                a.user_id AS accepted_editor_id,
                u.full_name AS accepted_editor_name,
                r.review_id
            FROM orders o
            LEFT JOIN applications a
                ON o.order_id = a.order_id
                AND a.status = 'ACCEPTED'

            LEFT JOIN users u
                ON a.user_id = u.user_id

            LEFT JOIN reviews r
                ON r.order_id = o.order_id
                AND r.client_id = o.user_id

            WHERE o.user_id = $1
            `,
            [req.user.user_id]
        );

        res.json({
            orders: result.rows
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Ошибка получения заказов'
        });
    }
};

exports.updateOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            title,
            description,
            budget,
            deadline,
            video_type
        } = req.body;

        const result = await pool.query(
            `
      UPDATE orders
      SET
        title = $1,
        description = $2,
        budget = $3,
        deadline = $4,
        video_type = $5
      WHERE order_id = $6
      AND user_id = $7
      AND status = 'OPEN'
      RETURNING *
      `,
            [
                title,
                description,
                budget,
                deadline,
                video_type,
                id,
                req.user.user_id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Заказ не найден, нет доступа или заказ уже нельзя редактировать'
            });
        }

        res.json({
            message: 'Заказ обновлён',
            order: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Ошибка при обновлении заказа'
        });
    }
};

exports.deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `
      DELETE FROM orders
      WHERE order_id = $1
      AND user_id = $2
      AND status = 'OPEN'
      RETURNING *
      `,
            [id, req.user.user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Заказ не найден или его нельзя удалить'
            });
        }

        res.json({
            message: 'Заказ удалён',
            order: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Ошибка удаления заказа'
        });
    }
};

exports.adminDeleteOrder = async (req, res) => {
    try {
        const { id } = req.params;

        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({
                message: 'Доступ запрещён'
            });
        }

        const result = await pool.query(
            `
      DELETE FROM orders
      WHERE order_id = $1
      RETURNING *
      `,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Заказ не найден'
            });
        }

        res.json({
            message: 'Заказ удалён администратором',
            order: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Ошибка удаления заказа'
        });
    }
};

exports.completeOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `
            UPDATE orders
            SET status = 'COMPLETED'
            WHERE order_id = $1
            AND user_id = $2
            AND status = 'IN_PROGRESS'
            RETURNING *
            `,
            [id, req.user.user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Заказ не найден или его нельзя завершить'
            });
        }

        res.json({
            message: 'Заказ завершён',
            order: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Ошибка завершения заказа'
        });
    }
};
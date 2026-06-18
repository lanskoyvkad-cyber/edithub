const pool = require('../config/db');

exports.createReview = async (req, res) => {
    try {
        const {
            order_id,
            editor_id,
            quality_rating,
            deadline_rating,
            communication_rating,
            comment
        } = req.body;

        const rating = (
            Number(quality_rating) +
            Number(deadline_rating) +
            Number(communication_rating)
        ) / 3;

        const existingReview = await pool.query(
            `
            SELECT *
            FROM reviews
            WHERE order_id = $1
            AND client_id = $2
            `,
            [order_id, req.user.user_id]
        );

        if (existingReview.rows.length > 0) {
            return res.status(400).json({
                message: 'Вы уже оставили отзыв на этот заказ'
            });
        }

        const result = await pool.query(
            `
            INSERT INTO reviews
            (
                order_id,
                client_id,
                editor_id,
                rating,
                quality_rating,
                deadline_rating,
                communication_rating,
                comment
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
            RETURNING *
            `,
            [
                order_id,
                req.user.user_id,
                editor_id,
                rating,
                quality_rating,
                deadline_rating,
                communication_rating,
                comment
            ]
        );

        await pool.query(
            `
            UPDATE orders
            SET status = 'COMPLETED'
            WHERE order_id = $1
            `,
            [order_id]
        );

        res.status(201).json({
            message: 'Отзыв успешно добавлен, заказ завершён',
            review: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Ошибка при добавлении отзыва'
        });
    }
};

exports.getReviewsByEditor = async (req, res) => {
    try {
        const { editorId } = req.params;

        const result = await pool.query(
            `
            SELECT 
                r.*,
                u.full_name AS client_name
            FROM reviews r
            JOIN users u ON r.client_id = u.user_id
            WHERE r.editor_id = $1
            ORDER BY r.created_at DESC
            `,
            [editorId]
        );

        res.json({
            reviews: result.rows
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Ошибка при получении отзывов'
        });
    }
};

exports.getReviewsByOrder = async (req, res) => {
    try {
        const { orderId } = req.params;

        const result = await pool.query(
            `
            SELECT 
                r.*,
                client.full_name AS client_name,
                editor.full_name AS editor_name
            FROM reviews r
            JOIN users client ON r.client_id = client.user_id
            JOIN users editor ON r.editor_id = editor.user_id
            WHERE r.order_id = $1
            ORDER BY r.created_at DESC
            `,
            [orderId]
        );

        res.json({
            reviews: result.rows
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Ошибка при получении отзывов заказа'
        });
    }
};

exports.getAllReviews = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({
                message: 'Доступ запрещён'
            });
        }

        const result = await pool.query(
            `
      SELECT 
        r.*,
        client.full_name AS client_name,
        editor.full_name AS editor_name,
        o.title AS order_title
      FROM reviews r
      LEFT JOIN users client ON r.client_id = client.user_id
      LEFT JOIN users editor ON r.editor_id = editor.user_id
      LEFT JOIN orders o ON r.order_id = o.order_id
      ORDER BY r.created_at DESC
      `
        );

        res.json({
            reviews: result.rows
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Ошибка получения отзывов'
        });
    }
};

exports.deleteReview = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({
                message: 'Доступ запрещён'
            });
        }

        const { id } = req.params;

        const result = await pool.query(
            `
      DELETE FROM reviews
      WHERE review_id = $1
      RETURNING *
      `,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Отзыв не найден'
            });
        }

        res.json({
            message: 'Отзыв удалён',
            review: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Ошибка удаления отзыва'
        });
    }
};
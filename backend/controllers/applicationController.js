const pool = require('../config/db');

exports.createApplication = async (req, res) => {
    try {
        const { order_id, message } = req.body;

        const orderResult = await pool.query(
            `
            SELECT 
                order_id,
                title,
                user_id AS client_id
            FROM orders
            WHERE order_id = $1
            `,
            [order_id]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({
                message: 'Заказ не найден'
            });
        }

        const order = orderResult.rows[0];

        const result = await pool.query(
            `
            INSERT INTO applications
            (order_id, user_id, message)
            VALUES ($1, $2, $3)
            RETURNING *
            `,
            [
                order_id,
                req.user.user_id,
                message
            ]
        );

        await pool.query(
            `
            INSERT INTO notifications (user_id, title, message)
            VALUES ($1, $2, $3)
            `,
            [
                order.client_id,
                'Новый отклик на заказ',
                `На ваш заказ "${order.title}" поступил новый отклик.`
            ]
        );

        res.status(201).json({
            message: 'Отклик успешно отправлен',
            application: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Ошибка при отправке отклика'
        });
    }
};

exports.getApplicationsByOrder = async (req, res) => {
    try {
        const { orderId } = req.params;

        const result = await pool.query(
            `
            SELECT 
                a.*,
                u.full_name AS editor_name,
                u.city AS editor_city,
                u.email AS editor_email
            FROM applications a
            JOIN users u ON a.user_id = u.user_id
            WHERE a.order_id = $1
            ORDER BY a.created_at DESC
            `,
            [orderId]
        );

        res.json({
            applications: result.rows
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Ошибка при получении откликов'
        });
    }
};

exports.updateApplicationStatus = async (req, res) => {
    const client = await pool.connect();

    try {
        const { id } = req.params;
        const { status } = req.body;

        await client.query('BEGIN');

        const applicationResult = await client.query(
            `
            SELECT 
                a.*,
                o.user_id AS order_owner_id,
                o.title AS order_title
            FROM applications a
            JOIN orders o ON a.order_id = o.order_id
            WHERE a.application_id = $1
            `,
            [id]
        );

        if (applicationResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                message: 'Отклик не найден'
            });
        }

        const application = applicationResult.rows[0];

        if (
            req.user.role !== 'ADMIN' &&
            req.user.user_id !== application.order_owner_id
        ) {
            await client.query('ROLLBACK');
            return res.status(403).json({
                message: 'Можно изменять только отклики на свои заказы'
            });
        }

        const updatedApplication = await client.query(
            `
            UPDATE applications
            SET status = $1
            WHERE application_id = $2
            RETURNING *
            `,
            [status, id]
        );

        if (status === 'ACCEPTED') {
            await client.query(
                `
                UPDATE orders
                SET status = 'IN_PROGRESS'
                WHERE order_id = $1
                `,
                [application.order_id]
            );

            await client.query(
                `
                UPDATE applications
                SET status = 'REJECTED'
                WHERE order_id = $1
                AND application_id <> $2
                `,
                [application.order_id, id]
            );

            await client.query(
                `
                INSERT INTO chats (client_id, editor_id)
                VALUES ($1, $2)
                ON CONFLICT DO NOTHING
                `,
                [application.order_owner_id, application.user_id]
            );

            await client.query(
                `
                INSERT INTO notifications (user_id, title, message)
                VALUES ($1, $2, $3)
                `,
                [
                    application.user_id,
                    'Ваш отклик принят',
                    `Заказчик принял ваш отклик на заказ "${application.order_title}". Заказ перешёл в работу.`
                ]
            );
        }

        if (status === 'REJECTED') {
            await client.query(
                `
                INSERT INTO notifications (user_id, title, message)
                VALUES ($1, $2, $3)
                `,
                [
                    application.user_id,
                    'Ваш отклик отклонён',
                    `Ваш отклик на заказ "${application.order_title}" был отклонён.`
                ]
            );
        }

        await client.query('COMMIT');

        res.json({
            message: 'Статус отклика обновлён',
            application: updatedApplication.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');

        console.error(error);

        res.status(500).json({
            message: 'Ошибка при обновлении отклика'
        });

    } finally {
        client.release();
    }
};

exports.getMyApplications = async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT
                a.*,
                o.title AS order_title,
                o.description AS order_description,
                o.budget,
                o.video_type,
                o.status AS order_status
            FROM applications a
            JOIN orders o ON a.order_id = o.order_id
            WHERE a.user_id = $1
            ORDER BY a.created_at DESC
            `,
            [req.user.user_id]
        );

        res.json({
            applications: result.rows
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Ошибка при получении моих откликов'
        });
    }
};
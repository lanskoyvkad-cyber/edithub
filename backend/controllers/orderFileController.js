const pool = require('../config/db');

const decodeFileName = (fileName) => {
    try {
        const decoded = Buffer.from(fileName, 'latin1').toString('utf8');

        if (decoded.includes('�')) {
            return fileName;
        }

        return decoded;
    } catch (error) {
        return fileName;
    }
};

exports.uploadOrderFile = async (req, res) => {
    try {
        const { orderId } = req.params;

        if (!req.file) {
            return res.status(400).json({
                message: 'Файл не выбран'
            });
        }

        const orderResult = await pool.query(
            `
      SELECT *
      FROM orders
      WHERE order_id = $1
      `,
            [orderId]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({
                message: 'Заказ не найден'
            });
        }

        const order = orderResult.rows[0];

        const currentUserId = Number(req.user.user_id || req.user.id);
        const orderClientId = Number(order.client_id || order.user_id);

        const isOwner = orderClientId === currentUserId;
        const isAdmin = req.user.role === 'ADMIN';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                message: 'Вы не можете прикреплять файлы к этому заказу'
            });
        }

        const fileUrl = `/uploads/orders/${req.file.filename}`;
        const originalName = decodeFileName(req.file.originalname);

        const result = await pool.query(
            `
      INSERT INTO order_files
      (order_id, uploaded_by, file_url, file_name, file_type, file_size)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
            [
                orderId,
                req.user.user_id,
                fileUrl,
                originalName,
                req.file.mimetype,
                req.file.size
            ]
        );

        res.status(201).json({
            message: 'Файл прикреплён к заказу',
            file: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Ошибка загрузки файла заказа'
        });
    }
};

exports.getOrderFiles = async (req, res) => {
    try {
        const { orderId } = req.params;

        const currentUserId = Number(req.user.user_id || req.user.id);

        const orderResult = await pool.query(
            `
      SELECT *
      FROM orders
      WHERE order_id = $1
      `,
            [orderId]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({
                message: 'Заказ не найден'
            });
        }

        const order = orderResult.rows[0];

        const orderClientId = Number(order.client_id || order.user_id);

        const isClient = orderClientId === currentUserId;
        const isAdmin = req.user.role === 'ADMIN';

        const isAssignedByOrderField =
            Number(order.editor_id || order.accepted_editor_id) === currentUserId;

        let hasAcceptedApplication = false;

        if (req.user.role === 'EDITOR') {
            const acceptedApplicationResult = await pool.query(
                `
        SELECT 1
        FROM applications
        WHERE order_id = $1
        AND user_id = $2
        AND status = 'ACCEPTED'
        LIMIT 1
        `,
                [orderId, currentUserId]
            );

            hasAcceptedApplication = acceptedApplicationResult.rows.length > 0;
        }

        const isAssignedEditor =
            isAssignedByOrderField || hasAcceptedApplication;

        if (!isClient && !isAssignedEditor && !isAdmin) {
            return res.status(403).json({
                message: 'Нет доступа к файлам этого заказа'
            });
        }

        const result = await pool.query(
            `
      SELECT 
        f.*,
        u.full_name AS uploaded_by_name
      FROM order_files f
      JOIN users u ON f.uploaded_by = u.user_id
      WHERE f.order_id = $1
      ORDER BY f.created_at DESC
      `,
            [orderId]
        );

        res.json({
            files: result.rows
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Ошибка получения файлов заказа'
        });
    }
};

exports.deleteOrderFile = async (req, res) => {
    try {
        const { fileId } = req.params;

        const fileResult = await pool.query(
            `
      SELECT 
        f.*,
        o.client_id
      FROM order_files f
      JOIN orders o ON f.order_id = o.order_id
      WHERE f.order_file_id = $1
      `,
            [fileId]
        );

        if (fileResult.rows.length === 0) {
            return res.status(404).json({
                message: 'Файл не найден'
            });
        }

        const file = fileResult.rows[0];

        const currentUserId = Number(req.user.user_id || req.user.id);

        const isOwner = Number(file.client_id || file.user_id) === currentUserId;
        const isUploader = Number(file.uploaded_by) === currentUserId;
        const isAdmin = req.user.role === 'ADMIN';

        if (!isOwner && !isUploader && !isAdmin) {
            return res.status(403).json({
                message: 'Вы не можете удалить этот файл'
            });
        }

        await pool.query(
            `
      DELETE FROM order_files
      WHERE order_file_id = $1
      `,
            [fileId]
        );

        res.json({
            message: 'Файл удалён'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Ошибка удаления файла заказа'
        });
    }
};
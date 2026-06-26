const path = require('path');
const fs = require('fs');
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

const isAcceptedEditorForOrder = async (orderId, userId) => {
    const result = await pool.query(
        `
    SELECT 1
    FROM applications
    WHERE order_id = $1
    AND user_id = $2
    AND status = 'ACCEPTED'
    LIMIT 1
    `,
        [orderId, userId]
    );

    return result.rows.length > 0;
};

exports.getResultFiles = async (req, res) => {
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

        const isClient = Number(order.user_id) === currentUserId;
        const isAdmin = req.user.role === 'ADMIN';
        const isAssignedEditor =
            req.user.role === 'EDITOR' &&
            await isAcceptedEditorForOrder(orderId, currentUserId);

        if (!isClient && !isAssignedEditor && !isAdmin) {
            return res.status(403).json({
                message: 'Нет доступа к результатам этого заказа'
            });
        }

        const result = await pool.query(
            `
      SELECT 
        f.*,
        u.full_name AS uploaded_by_name
      FROM order_result_files f
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
            message: 'Ошибка получения файлов результата'
        });
    }
};

exports.uploadResultFile = async (req, res) => {
    try {
        const { orderId } = req.params;
        const currentUserId = Number(req.user.user_id || req.user.id);

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

        const isAdmin = req.user.role === 'ADMIN';
        const isAssignedEditor =
            req.user.role === 'EDITOR' &&
            await isAcceptedEditorForOrder(orderId, currentUserId);

        if (!isAssignedEditor && !isAdmin) {
            return res.status(403).json({
                message: 'Только утверждённый монтажёр может загрузить результат'
            });
        }

        if (order.status !== 'IN_PROGRESS' && !isAdmin) {
            return res.status(400).json({
                message: 'Результат можно загрузить только для заказа в работе'
            });
        }

        const fileUrl = `/uploads/order-results/${req.file.filename}`;
        const originalName = decodeFileName(req.file.originalname);

        const result = await pool.query(
            `
      INSERT INTO order_result_files
      (order_id, uploaded_by, file_url, file_name, file_type, file_size)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
            [
                orderId,
                currentUserId,
                fileUrl,
                originalName,
                req.file.mimetype,
                req.file.size
            ]
        );

        res.status(201).json({
            message: 'Результат загружен',
            file: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Ошибка загрузки результата'
        });
    }
};

exports.downloadResultFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const currentUserId = Number(req.user.user_id || req.user.id);

        const fileResult = await pool.query(
            `
      SELECT 
        f.*,
        o.user_id,
        o.status
      FROM order_result_files f
      JOIN orders o ON f.order_id = o.order_id
      WHERE f.result_file_id = $1
      `,
            [fileId]
        );

        if (fileResult.rows.length === 0) {
            return res.status(404).json({
                message: 'Файл не найден'
            });
        }

        const file = fileResult.rows[0];

        const isClient = Number(file.user_id) === currentUserId;
        const isAdmin = req.user.role === 'ADMIN';
        const isAssignedEditor =
            req.user.role === 'EDITOR' &&
            await isAcceptedEditorForOrder(file.order_id, currentUserId);

        if (!isClient && !isAssignedEditor && !isAdmin) {
            return res.status(403).json({
                message: 'Нет доступа к скачиванию результата'
            });
        }

        const fileNameOnDisk = path.basename(file.file_url);

        const filePath = path.join(
            __dirname,
            '..',
            'uploads',
            'order-results',
            fileNameOnDisk
        );

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                message: 'Файл отсутствует на сервере'
            });
        }

        return res.download(filePath, file.file_name || fileNameOnDisk);

    } catch (error) {
        console.error('Ошибка скачивания результата:', error);

        return res.status(500).json({
            message: 'Ошибка скачивания результата',
            error: error.message
        });
    }
};

exports.deleteResultFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const currentUserId = Number(req.user.user_id || req.user.id);

        const fileResult = await pool.query(
            `
      SELECT *
      FROM order_result_files
      WHERE result_file_id = $1
      `,
            [fileId]
        );

        if (fileResult.rows.length === 0) {
            return res.status(404).json({
                message: 'Файл не найден'
            });
        }

        const file = fileResult.rows[0];

        const isUploader = Number(file.uploaded_by) === currentUserId;
        const isAdmin = req.user.role === 'ADMIN';

        if (!isUploader && !isAdmin) {
            return res.status(403).json({
                message: 'Вы не можете удалить этот файл'
            });
        }

        await pool.query(
            `
      DELETE FROM order_result_files
      WHERE result_file_id = $1
      `,
            [fileId]
        );

        res.json({
            message: 'Файл результата удалён'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Ошибка удаления результата'
        });
    }
};
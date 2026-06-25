const pool = require('../config/db');

exports.getNotifications = async (req, res) => {
    try {
        const result = await pool.query(
            `
      SELECT *
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
            [req.user.user_id]
        );

        res.json({
            notifications: result.rows
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Ошибка получения уведомлений'
        });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `
      UPDATE notifications
      SET is_read = TRUE
      WHERE notification_id = $1
      AND user_id = $2
      RETURNING *
      `,
            [id, req.user.user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Уведомление не найдено'
            });
        }

        res.json({
            message: 'Уведомление прочитано',
            notification: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Ошибка обновления уведомления'
        });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        await pool.query(
            `
      UPDATE notifications
      SET is_read = TRUE
      WHERE user_id = $1
      `,
            [req.user.user_id]
        );

        res.json({
            message: 'Все уведомления прочитаны'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Ошибка обновления уведомлений'
        });
    }
};

exports.markChatNotificationsAsRead = async (req, res) => {
    try {
        const { chatId } = req.params;

        await pool.query(
            `
      UPDATE notifications
      SET is_read = TRUE
      WHERE user_id = $1
      AND chat_id = $2
      AND title = 'Новое сообщение'
      `,
            [req.user.user_id, chatId]
        );

        res.json({
            message: 'Уведомления чата прочитаны'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Ошибка обновления уведомлений чата'
        });
    }
};
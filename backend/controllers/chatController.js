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

exports.createChat = async (req, res) => {
    try {
        const client_id = req.user.user_id;
        const { editor_id } = req.body;

        if (req.user.role !== 'CLIENT') {
            return res.status(403).json({
                message: 'Создать чат с монтажёром может только заказчик'
            });
        }

        const editorResult = await pool.query(
            `
      SELECT user_id
      FROM users
      WHERE user_id = $1 AND role = 'EDITOR'
      `,
            [editor_id]
        );

        if (editorResult.rows.length === 0) {
            return res.status(404).json({
                message: 'Монтажёр не найден'
            });
        }

        const existingChat = await pool.query(
            `
      SELECT *
      FROM chats
      WHERE client_id = $1 AND editor_id = $2
      `,
            [client_id, editor_id]
        );

        if (existingChat.rows.length > 0) {
            return res.json({
                message: 'Чат уже существует',
                chat: existingChat.rows[0]
            });
        }

        const result = await pool.query(
            `
      INSERT INTO chats (client_id, editor_id)
      VALUES ($1, $2)
      RETURNING *
      `,
            [client_id, editor_id]
        );

        res.status(201).json({
            message: 'Чат создан',
            chat: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Ошибка создания чата'
        });
    }
};

exports.getMyChats = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const result = await pool.query(
            `
      SELECT 
        c.*,
        client.full_name AS client_name,
        editor.full_name AS editor_name,
        last_msg.message AS last_message,
        last_msg.created_at AS last_message_at,
        last_sender.full_name AS last_sender_name
      FROM chats c
      JOIN users client ON c.client_id = client.user_id
      JOIN users editor ON c.editor_id = editor.user_id
      LEFT JOIN LATERAL (
        SELECT 
          m.message,
          m.created_at,
          m.sender_id
        FROM messages m
        WHERE m.chat_id = c.chat_id
        ORDER BY m.created_at DESC
        LIMIT 1
      ) last_msg ON true
      LEFT JOIN users last_sender ON last_sender.user_id = last_msg.sender_id
      WHERE c.client_id = $1 OR c.editor_id = $1
      ORDER BY COALESCE(last_msg.created_at, c.created_at) DESC
      `,
            [userId]
        );

        res.json({
            chats: result.rows
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Ошибка при получении чатов'
        });
    }
};

exports.getMessagesByChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.user_id;

        const chatResult = await pool.query(
            `
      SELECT *
      FROM chats
      WHERE chat_id = $1
      AND (client_id = $2 OR editor_id = $2)
      `,
            [chatId, userId]
        );

        if (chatResult.rows.length === 0) {
            return res.status(403).json({
                message: 'Нет доступа к этому чату'
            });
        }

        const result = await pool.query(
            `
      SELECT 
        m.*,
        u.full_name AS sender_name
      FROM messages m
      JOIN users u ON m.sender_id = u.user_id
      WHERE m.chat_id = $1
      ORDER BY m.created_at ASC
      `,
            [chatId]
        );

        res.json({
            messages: result.rows
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Ошибка при получении сообщений'
        });
    }
};

exports.sendMessage = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { message } = req.body;
        const senderId = req.user.user_id;

        if (!message || !message.trim()) {
            return res.status(400).json({
                message: 'Сообщение не может быть пустым'
            });
        }

        const chatResult = await pool.query(
            `
      SELECT 
        c.*,
        sender.full_name AS sender_name
      FROM chats c
      JOIN users sender ON sender.user_id = $2
      WHERE c.chat_id = $1
      AND (c.client_id = $2 OR c.editor_id = $2)
      `,
            [chatId, senderId]
        );

        if (chatResult.rows.length === 0) {
            return res.status(403).json({
                message: 'Нет доступа к этому чату'
            });
        }

        const chat = chatResult.rows[0];

        const result = await pool.query(
            `
      INSERT INTO messages
      (chat_id, sender_id, message)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
            [
                chatId,
                senderId,
                message.trim()
            ]
        );

        const receiverId =
            Number(senderId) === Number(chat.client_id)
                ? chat.editor_id
                : chat.client_id;

        await pool.query(
            `
            INSERT INTO notifications (user_id, title, message, chat_id)
            VALUES ($1, $2, $3, $4)
            `,
            [
                receiverId,
                'Новое сообщение',
                `${chat.sender_name || 'Пользователь'} отправил вам новое сообщение в чате.`,
                chatId
            ]
        );

        res.status(201).json({
            message: 'Сообщение отправлено',
            data: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Ошибка при отправке сообщения'
        });
    }
};

exports.markChatAsRead = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.user_id;

        const chatResult = await pool.query(
            `
      SELECT *
      FROM chats
      WHERE chat_id = $1
      AND (client_id = $2 OR editor_id = $2)
      `,
            [chatId, userId]
        );

        if (chatResult.rows.length === 0) {
            return res.status(403).json({
                message: 'Нет доступа к этому чату'
            });
        }

        await pool.query(
            `
      UPDATE messages
      SET is_read = TRUE,
          read_at = NOW()
      WHERE chat_id = $1
      AND sender_id <> $2
      AND is_read = FALSE
      `,
            [chatId, userId]
        );

        await pool.query(
            `
      UPDATE notifications
      SET is_read = TRUE
      WHERE user_id = $1
      AND chat_id = $2
      AND title = 'Новое сообщение'
      `,
            [userId, chatId]
        );

        res.json({
            message: 'Чат отмечен как прочитанный'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Ошибка отметки чата как прочитанного'
        });
    }
};

exports.sendFileMessage = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { message } = req.body;
        const senderId = req.user.user_id;

        if (!req.file) {
            return res.status(400).json({
                message: 'Файл не выбран'
            });
        }

        const chatResult = await pool.query(
            `
      SELECT 
        c.*,
        sender.full_name AS sender_name
      FROM chats c
      JOIN users sender ON sender.user_id = $2
      WHERE c.chat_id = $1
      AND (c.client_id = $2 OR c.editor_id = $2)
      `,
            [chatId, senderId]
        );

        if (chatResult.rows.length === 0) {
            return res.status(403).json({
                message: 'Нет доступа к этому чату'
            });
        }

        const chat = chatResult.rows[0];

        const fileUrl = `/uploads/chats/${req.file.filename}`;

        const result = await pool.query(
            `
      INSERT INTO messages
      (chat_id, sender_id, message, file_url, file_name, file_type)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
            [
                chatId,
                senderId,
                message?.trim() || 'Файл',
                fileUrl,
                decodeFileName(req.file.originalname),
                req.file.mimetype
            ]
        );

        const receiverId =
            Number(senderId) === Number(chat.client_id)
                ? chat.editor_id
                : chat.client_id;

        await pool.query(
            `
      INSERT INTO notifications (user_id, title, message, chat_id)
      VALUES ($1, $2, $3, $4)
      `,
            [
                receiverId,
                'Новое сообщение',
                `${chat.sender_name || 'Пользователь'} отправил вам файл в чате.`,
                chatId
            ]
        );

        res.status(201).json({
            message: 'Файл отправлен',
            data: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Ошибка отправки файла'
        });
    }
};
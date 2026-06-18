const pool = require('../config/db');

exports.createChat = async (req, res) => {
    try {
        const { client_id, editor_id } = req.body;

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
            INSERT INTO chats
            (client_id, editor_id)
            VALUES ($1, $2)
            RETURNING *
            `,
            [client_id, editor_id]
        );

        res.status(201).json({
            message: 'Чат успешно создан',
            chat: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Ошибка при создании чата'
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
                editor.full_name AS editor_name
            FROM chats c
            JOIN users client ON c.client_id = client.user_id
            JOIN users editor ON c.editor_id = editor.user_id
            WHERE c.client_id = $1 OR c.editor_id = $1
            ORDER BY c.created_at DESC
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

        const result = await pool.query(
            `
            INSERT INTO messages
            (chat_id, sender_id, message)
            VALUES ($1, $2, $3)
            RETURNING *
            `,
            [
                chatId,
                req.user.user_id,
                message
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

exports.createChat = async (req, res) => {
  try {
    const client_id = req.user.user_id;
    const { editor_id } = req.body;

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
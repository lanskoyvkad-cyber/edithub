const pool = require('../config/db');

exports.createComplaint = async (req, res) => {
  try {
    const reporterId = req.user.user_id;
    const { target_type, target_id, reason, description } = req.body;

    if (!target_type || !target_id || !reason) {
      return res.status(400).json({
        message: 'Укажите тип объекта, ID объекта и причину жалобы'
      });
    }

    const allowedTypes = ['USER', 'ORDER', 'REVIEW', 'MESSAGE'];

    if (!allowedTypes.includes(target_type)) {
      return res.status(400).json({
        message: 'Недопустимый тип объекта жалобы'
      });
    }

    const result = await pool.query(
      `
      INSERT INTO complaints
      (reporter_id, target_type, target_id, reason, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        reporterId,
        target_type,
        target_id,
        reason,
        description || ''
      ]
    );

    res.status(201).json({
      message: 'Жалоба успешно отправлена',
      complaint: result.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Ошибка при создании жалобы'
    });
  }
};

exports.getMyComplaints = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM complaints
      WHERE reporter_id = $1
      ORDER BY created_at DESC
      `,
      [req.user.user_id]
    );

    res.json({
      complaints: result.rows
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Ошибка получения моих жалоб'
    });
  }
};

exports.getAllComplaints = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        message: 'Доступ запрещён'
      });
    }

    const result = await pool.query(
      `
      SELECT 
        c.*,

        reporter.full_name AS reporter_name,
        reporter.email AS reporter_email,

        target_user.full_name AS target_user_name,
        target_user.email AS target_user_email,
        target_user.is_blocked AS target_user_is_blocked,

        m.message AS target_message_text,
        m.file_name AS target_message_file_name,
        m.file_url AS target_message_file_url,
        m.chat_id AS target_message_chat_id,
        m.created_at AS target_message_created_at,

        message_sender.full_name AS target_message_sender_name,
        message_sender.email AS target_message_sender_email,
        message_sender.is_blocked AS target_message_sender_is_blocked

      FROM complaints c

      JOIN users reporter 
        ON c.reporter_id = reporter.user_id

      LEFT JOIN users target_user
        ON c.target_type = 'USER'
        AND c.target_id = target_user.user_id

      LEFT JOIN messages m
        ON c.target_type = 'MESSAGE'
        AND c.target_id = m.message_id

      LEFT JOIN users message_sender
        ON m.sender_id = message_sender.user_id

      ORDER BY c.created_at DESC
      `
    );

    res.json({
      complaints: result.rows
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Ошибка получения жалоб'
    });
  }
};

exports.updateComplaintStatus = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        message: 'Доступ запрещён'
      });
    }

    const { id } = req.params;
    const { status, admin_comment } = req.body;

    const allowedStatuses = ['NEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Недопустимый статус жалобы'
      });
    }

    const result = await pool.query(
      `
      UPDATE complaints
      SET
        status = $1,
        admin_comment = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE complaint_id = $3
      RETURNING *
      `,
      [
        status,
        admin_comment || '',
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Жалоба не найдена'
      });
    }

    res.json({
      message: 'Статус жалобы обновлён',
      complaint: result.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Ошибка обновления жалобы'
    });
  }
};

exports.deleteComplaint = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        message: 'Доступ запрещён'
      });
    }

    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM complaints
      WHERE complaint_id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Жалоба не найдена'
      });
    }

    res.json({
      message: 'Жалоба удалена',
      complaint: result.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Ошибка удаления жалобы'
    });
  }
};

exports.blockUserFromComplaint = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        message: 'Доступ запрещён'
      });
    }

    const { id } = req.params;

    const complaintResult = await pool.query(
      `
      SELECT *
      FROM complaints
      WHERE complaint_id = $1
      `,
      [id]
    );

    if (complaintResult.rows.length === 0) {
      return res.status(404).json({
        message: 'Жалоба не найдена'
      });
    }

    const complaint = complaintResult.rows[0];

    let userIdToBlock = null;

    if (complaint.target_type === 'USER') {
      userIdToBlock = complaint.target_id;
    }

    if (complaint.target_type === 'MESSAGE') {
      const messageResult = await pool.query(
        `
        SELECT sender_id
        FROM messages
        WHERE message_id = $1
        `,
        [complaint.target_id]
      );

      if (messageResult.rows.length === 0) {
        return res.status(404).json({
          message: 'Сообщение не найдено'
        });
      }

      userIdToBlock = messageResult.rows[0].sender_id;
    }

    if (!userIdToBlock) {
      return res.status(400).json({
        message: 'Для этого типа жалобы нельзя определить пользователя для блокировки'
      });
    }

    const userResult = await pool.query(
      `
      SELECT user_id, full_name, email, role, is_blocked
      FROM users
      WHERE user_id = $1
      `,
      [userIdToBlock]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        message: 'Пользователь не найден'
      });
    }

    const targetUser = userResult.rows[0];

    if (targetUser.role === 'ADMIN') {
      return res.status(400).json({
        message: 'Нельзя заблокировать администратора'
      });
    }

    const updatedUserResult = await pool.query(
      `
      UPDATE users
      SET is_blocked = TRUE
      WHERE user_id = $1
      RETURNING user_id, full_name, email, role, is_blocked
      `,
      [userIdToBlock]
    );

    await pool.query(
      `
      UPDATE complaints
      SET
        status = 'RESOLVED',
        admin_comment = COALESCE(NULLIF(admin_comment, ''), 'Пользователь заблокирован администратором'),
        updated_at = CURRENT_TIMESTAMP
      WHERE complaint_id = $1
      `,
      [id]
    );

    res.json({
      message: 'Пользователь заблокирован',
      user: updatedUserResult.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Ошибка блокировки пользователя'
    });
  }
};

exports.unblockUserFromComplaint = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        message: 'Доступ запрещён'
      });
    }

    const { id } = req.params;

    const complaintResult = await pool.query(
      `
      SELECT *
      FROM complaints
      WHERE complaint_id = $1
      `,
      [id]
    );

    if (complaintResult.rows.length === 0) {
      return res.status(404).json({
        message: 'Жалоба не найдена'
      });
    }

    const complaint = complaintResult.rows[0];

    let userIdToUnblock = null;

    if (complaint.target_type === 'USER') {
      userIdToUnblock = complaint.target_id;
    }

    if (complaint.target_type === 'MESSAGE') {
      const messageResult = await pool.query(
        `
        SELECT sender_id
        FROM messages
        WHERE message_id = $1
        `,
        [complaint.target_id]
      );

      if (messageResult.rows.length === 0) {
        return res.status(404).json({
          message: 'Сообщение не найдено'
        });
      }

      userIdToUnblock = messageResult.rows[0].sender_id;
    }

    if (!userIdToUnblock) {
      return res.status(400).json({
        message: 'Не удалось определить пользователя для разблокировки'
      });
    }

    const updatedUserResult = await pool.query(
      `
      UPDATE users
      SET is_blocked = FALSE
      WHERE user_id = $1
      RETURNING user_id, full_name, email, role, is_blocked
      `,
      [userIdToUnblock]
    );

    if (updatedUserResult.rows.length === 0) {
      return res.status(404).json({
        message: 'Пользователь не найден'
      });
    }

    await pool.query(
      `
      UPDATE complaints
      SET
        admin_comment = 'Пользователь разблокирован администратором',
        updated_at = CURRENT_TIMESTAMP
      WHERE complaint_id = $1
      `,
      [id]
    );

    res.json({
      message: 'Пользователь разблокирован',
      user: updatedUserResult.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Ошибка разблокировки пользователя'
    });
  }
};
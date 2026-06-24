const pool = require('../config/db');

exports.getUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        user_id,
        email,
        role,
        full_name,
        city,
        avatar,
        created_at
      FROM users
      ORDER BY user_id ASC
    `);

    res.json({
      users: result.rows
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Ошибка при получении пользователей'
    });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (role === 'ADMIN') {
      return res.status(403).json({
        message: 'Назначение роли ADMIN запрещено'
      });
    }

    const targetUser = await pool.query(
      'SELECT role FROM users WHERE user_id = $1',
      [id]
    );

    if (targetUser.rows.length === 0) {
      return res.status(404).json({
        message: 'Пользователь не найден'
      });
    }

    if (targetUser.rows[0].role === 'ADMIN') {
      return res.status(403).json({
        message: 'Нельзя изменять роль администратора'
      });
    }

    const result = await pool.query(
      `
      UPDATE users
      SET role = $1
      WHERE user_id = $2
      RETURNING user_id, email, role, full_name, city
      `,
      [role, id]
    );

    res.json({
      message: 'Роль пользователя обновлена',
      user: result.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Ошибка при обновлении роли'
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const targetUser = await pool.query(
      'SELECT role FROM users WHERE user_id = $1',
      [id]
    );

    if (targetUser.rows.length === 0) {
      return res.status(404).json({
        message: 'Пользователь не найден'
      });
    }

    if (targetUser.rows[0].role === 'ADMIN') {
      return res.status(403).json({
        message: 'Нельзя удалить администратора'
      });
    }

    const result = await pool.query(
      `
      DELETE FROM users
      WHERE user_id = $1
      RETURNING user_id, email, role, full_name
      `,
      [id]
    );

    res.json({
      message: 'Пользователь удалён',
      user: result.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Ошибка при удалении пользователя'
    });
  }
};

exports.getAdminStats = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        message: 'Доступ запрещён'
      });
    }

    const users = await pool.query('SELECT COUNT(*) FROM users');
    const clients = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'CLIENT'");
    const editors = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'EDITOR'");
    const orders = await pool.query('SELECT COUNT(*) FROM orders');
    const services = await pool.query('SELECT COUNT(*) FROM services');
    const reviews = await pool.query('SELECT COUNT(*) FROM reviews');

    res.json({
      stats: {
        users: Number(users.rows[0].count),
        clients: Number(clients.rows[0].count),
        editors: Number(editors.rows[0].count),
        orders: Number(orders.rows[0].count),
        services: Number(services.rows[0].count),
        reviews: Number(reviews.rows[0].count)
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Ошибка получения статистики'
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const {
      full_name,
      city,
      avatar,
      bio,
      skills,
      software,
      video_types,
      experience,
      telegram,
      youtube,
      instagram
    } = req.body;

    const result = await pool.query(
      `
      UPDATE users
      SET
        full_name = $1,
        city = $2,
        avatar = $3,
        bio = $4,
        skills = $5,
        software = $6,
        video_types = $7,
        experience = $8,
        telegram = $9,
        youtube = $10,
        instagram = $11
      WHERE user_id = $12
      RETURNING 
        user_id, 
        email, 
        role, 
        full_name, 
        city, 
        avatar, 
        bio,
        skills,
        software,
        video_types,
        experience,
        telegram,
        youtube,
        instagram
      `,
      [
        full_name,
        city,
        avatar,
        bio,
        skills,
        software,
        video_types,
        experience,
        telegram,
        youtube,
        instagram,
        req.user.user_id
      ]
    );

    res.json({
      message: 'Профиль обновлён',
      user: result.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Ошибка обновления профиля'
    });
  }
};

exports.getEditorProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const userResult = await pool.query(
      `
      SELECT 
        user_id,
        email,
        role,
        full_name,
        city,
        avatar,
        bio,
        skills,
        software,
        video_types,
        experience,
        telegram,
        youtube,
        instagram,
        created_at
      FROM users
      WHERE user_id = $1
      AND role = 'EDITOR'
      `,
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        message: 'Монтажёр не найден'
      });
    }

    const servicesResult = await pool.query(
      `
      SELECT *
      FROM services
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [id]
    );

    const portfolioResult = await pool.query(
      `
      SELECT *
      FROM portfolio
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [id]
    );

    const reviewsResult = await pool.query(
      `
      SELECT 
        r.*,
        u.full_name AS client_name
      FROM reviews r
      JOIN users u ON r.client_id = u.user_id
      WHERE r.editor_id = $1
      ORDER BY r.created_at DESC
      `,
      [id]
    );

    const reviews = reviewsResult.rows;

    let averageRating = 0;

    if (reviews.length > 0) {
      const sum = reviews.reduce(
        (acc, review) => acc + Number(review.rating || 0),
        0
      );

      averageRating = Number((sum / reviews.length).toFixed(1));
    }

    res.json({
      editor: userResult.rows[0],
      services: servicesResult.rows,
      portfolio: portfolioResult.rows,
      reviews,
      averageRating
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Ошибка получения профиля монтажёра'
    });
  }
};

exports.getEditors = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        u.user_id,
        u.full_name,
        u.city,
        u.avatar,
        u.bio,
        u.skills,
        u.software,
        u.video_types,
        u.experience,
        COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) AS average_rating,
        COUNT(r.review_id)::int AS reviews_count
      FROM users u
      LEFT JOIN reviews r ON r.editor_id = u.user_id
      WHERE u.role = 'EDITOR'
      GROUP BY 
        u.user_id,
        u.full_name,
        u.city,
        u.avatar,
        u.bio,
        u.skills,
        u.software,
        u.video_types,
        u.experience
      ORDER BY average_rating DESC, reviews_count DESC
      `
    );

    res.json({
      editors: result.rows
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Ошибка получения списка монтажёров'
    });
  }
};
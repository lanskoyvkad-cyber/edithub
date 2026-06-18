const pool = require('../config/db');

exports.createPortfolioItem = async (req, res) => {
    try {
        const { title, description, video_url } = req.body;

        const result = await pool.query(
            `
            INSERT INTO portfolio
            (user_id, title, description, video_url)
            VALUES ($1, $2, $3, $4)
            RETURNING *
            `,
            [
                req.user.user_id,
                title,
                description,
                video_url
            ]
        );

        res.status(201).json({
            message: 'Работа успешно добавлена в портфолио',
            portfolio: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Ошибка при добавлении работы'
        });
    }
};

exports.getPortfolio = async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT 
                p.*,
                u.full_name AS editor_name,
                u.city AS editor_city
            FROM portfolio p
            JOIN users u ON p.user_id = u.user_id
            ORDER BY p.created_at DESC
            `
        );

        res.json({
            portfolio: result.rows
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Ошибка при получении портфолио'
        });
    }
};

exports.getPortfolioByUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await pool.query(
            `
            SELECT 
                p.*,
                u.full_name AS editor_name,
                u.city AS editor_city
            FROM portfolio p
            JOIN users u ON p.user_id = u.user_id
            WHERE p.user_id = $1
            ORDER BY p.created_at DESC
            `,
            [userId]
        );

        res.json({
            portfolio: result.rows
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Ошибка при получении портфолио пользователя'
        });
    }
};

exports.deletePortfolioItem = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `
            DELETE FROM portfolio
            WHERE portfolio_id = $1 AND user_id = $2
            RETURNING *
            `,
            [id, req.user.user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Работа не найдена или нет доступа'
            });
        }

        res.json({
            message: 'Работа удалена',
            portfolio: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Ошибка при удалении работы'
        });
    }
};

exports.updatePortfolioItem = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      description,
      video_url
    } = req.body;

    const result = await pool.query(
      `
      UPDATE portfolio
      SET
        title = $1,
        description = $2,
        video_url = $3
      WHERE portfolio_id = $4
      AND user_id = $5
      RETURNING *
      `,
      [
        title,
        description,
        video_url,
        id,
        req.user.user_id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Работа не найдена'
      });
    }

    res.json({
      message: 'Работа обновлена',
      item: result.rows[0]
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Ошибка обновления работы'
    });
  }
};
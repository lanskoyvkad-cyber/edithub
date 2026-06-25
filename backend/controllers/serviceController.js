const pool = require('../config/db');

exports.createService = async (req, res) => {
  try {
    const { title, description, price, deadline } = req.body;

    const result = await pool.query(
      `
            INSERT INTO services
            (user_id, title, description, price, deadline)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            `,
      [
        req.user.user_id,
        title,
        description,
        price,
        deadline
      ]
    );

    res.status(201).json({
      message: 'Услуга успешно создана',
      service: result.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Ошибка при создании услуги'
    });
  }
};

exports.getServices = async (req, res) => {
  try {
    const result = await pool.query(
      `
            SELECT 
                s.*,
                u.full_name AS editor_name,
                u.city AS editor_city
            FROM services s
            JOIN users u ON s.user_id = u.user_id
            ORDER BY s.created_at DESC
            `
    );

    res.json({
      services: result.rows
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Ошибка при получении услуг'
    });
  }
};

exports.getServiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
            SELECT 
                s.*,
                u.full_name AS editor_name,
                u.city AS editor_city
            FROM services s
            JOIN users u ON s.user_id = u.user_id
            WHERE s.service_id = $1
            `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Услуга не найдена'
      });
    }

    res.json({
      service: result.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Ошибка при получении услуги'
    });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM services
      WHERE service_id = $1
      AND user_id = $2
      RETURNING *
      `,
      [id, req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Услуга не найдена или нет доступа'
      });
    }

    res.json({
      message: 'Услуга удалена',
      service: result.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Ошибка при удалении услуги'
    });
  }
};

exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, deadline } = req.body;

    const result = await pool.query(
      `
      UPDATE services
      SET 
        title = $1,
        description = $2,
        price = $3,
        deadline = $4
      WHERE service_id = $5
      AND user_id = $6
      RETURNING *
      `,
      [
        title,
        description,
        price,
        deadline,
        id,
        req.user.user_id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Услуга не найдена или нет доступа'
      });
    }

    res.json({
      message: 'Услуга обновлена',
      service: result.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Ошибка при обновлении услуги'
    });
  }
};
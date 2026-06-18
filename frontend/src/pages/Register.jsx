import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
    role: 'CLIENT',
    full_name: '',
    city: ''
  });

  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/register', form);

      setMessage(response.data.message || 'Регистрация выполнена успешно');
      setIsSuccess(true);

      setForm({
        email: '',
        password: '',
        role: 'CLIENT',
        full_name: '',
        city: ''
      });

      setTimeout(() => {
        navigate('/login');
      }, 1000);

    } catch (error) {
      setMessage(error.response?.data?.message || 'Ошибка регистрации');
      setIsSuccess(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="page">
      <div
        className="card"
        style={{
          maxWidth: '520px',
          margin: '50px auto'
        }}
      >
        <h2 style={{ marginTop: 0, textAlign: 'center' }}>
          Регистрация
        </h2>

        <p
          className="empty-text"
          style={{
            textAlign: 'center',
            marginBottom: '25px'
          }}
        >
          Создайте аккаунт заказчика или монтажёра для работы на платформе.
        </p>

        {message && (
          <div
            style={{
              background: isSuccess
                ? 'rgba(34, 197, 94, 0.12)'
                : 'rgba(239, 68, 68, 0.12)',
              border: isSuccess
                ? '1px solid rgba(34, 197, 94, 0.35)'
                : '1px solid rgba(239, 68, 68, 0.35)',
              color: isSuccess ? '#86efac' : '#fca5a5',
              borderRadius: '10px',
              padding: '12px',
              marginBottom: '15px'
            }}
          >
            {message}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            margin: 0,
            padding: 0,
            border: 'none',
            background: 'transparent'
          }}
        >
          <label>
            <strong>ФИО</strong>

            <input
              name="full_name"
              placeholder="Введите ФИО"
              value={form.full_name}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                marginTop: '6px'
              }}
            />
          </label>

          <label>
            <strong>Email</strong>

            <input
              name="email"
              type="email"
              placeholder="Введите email"
              value={form.email}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                marginTop: '6px'
              }}
            />
          </label>

          <label>
            <strong>Пароль</strong>

            <input
              name="password"
              type="password"
              placeholder="Введите пароль"
              value={form.password}
              onChange={handleChange}
              required
              minLength="4"
              style={{
                width: '100%',
                marginTop: '6px'
              }}
            />
          </label>

          <label>
            <strong>Роль</strong>

            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              style={{
                width: '100%',
                marginTop: '6px'
              }}
            >
              <option value="CLIENT">Заказчик</option>
              <option value="EDITOR">Монтажёр</option>
            </select>
          </label>

          <label>
            <strong>Город</strong>

            <input
              name="city"
              placeholder="Введите город"
              value={form.city}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                marginTop: '6px'
              }}
            />
          </label>

          <div
            style={{
              background: '#0f172a',
              border: '1px solid #374151',
              borderRadius: '12px',
              padding: '14px'
            }}
          >
            <strong>
              {form.role === 'CLIENT'
                ? 'Вы регистрируетесь как заказчик'
                : 'Вы регистрируетесь как монтажёр'}
            </strong>

            <p className="empty-text" style={{ marginBottom: 0 }}>
              {form.role === 'CLIENT'
                ? 'Вы сможете создавать заказы, выбирать исполнителей и оставлять отзывы.'
                : 'Вы сможете откликаться на заказы, оформлять профиль, добавлять услуги и портфолио.'}
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: '10px',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>

        <p
          className="empty-text"
          style={{
            textAlign: 'center',
            marginTop: '20px'
          }}
        >
          Уже есть аккаунт?{' '}
          <Link to="/login">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: ''
  });

  const [message, setMessage] = useState('');
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
      const response = await api.post('/auth/login', form);

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      const role = response.data.user.role;

      if (role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/profile');
      }

      window.location.reload();

    } catch (error) {
      setMessage(error.response?.data?.message || 'Ошибка входа');
      setIsLoading(false);
    }
  };

  return (
    <div className="page">
      <div
        className="card"
        style={{
          maxWidth: '460px',
          margin: '50px auto'
        }}
      >
        <h2 style={{ marginTop: 0, textAlign: 'center' }}>
          Вход
        </h2>

        <p
          className="empty-text"
          style={{
            textAlign: 'center',
            marginBottom: '25px'
          }}
        >
          Войдите в аккаунт, чтобы работать с заказами, откликами и чатами.
        </p>

        {message && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
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
              style={{
                width: '100%',
                marginTop: '6px'
              }}
            />
          </label>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: '10px',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <p
          className="empty-text"
          style={{
            textAlign: 'center',
            marginTop: '20px'
          }}
        >
          Нет аккаунта?{' '}
          <Link to="/register">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
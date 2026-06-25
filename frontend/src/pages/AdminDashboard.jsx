import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function AdminDashboard() {
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  const [stats, setStats] = useState({
    users: 0,
    clients: 0,
    editors: 0,
    orders: 0,
    services: 0,
    reviews: 0
  });

  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      const response = await api.get('/users/stats', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = response.data.stats || response.data;

      setStats({
        users: data.users || data.totalUsers || data.usersCount || data.total_users || 0,
        clients: data.clients || data.clientsCount || data.clients_count || 0,
        editors: data.editors || data.editorsCount || data.editors_count || 0,
        orders: data.orders || data.ordersCount || data.orders_count || 0,
        services: data.services || data.servicesCount || data.services_count || 0,
        reviews: data.reviews || data.reviewsCount || data.reviews_count || 0
      });

    } catch (error) {
      console.error(error);
      alert('Ошибка загрузки статистики');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const statCards = [
    {
      title: 'Всего пользователей',
      value: stats.users,
      description: 'Все зарегистрированные аккаунты'
    },
    {
      title: 'Заказчиков',
      value: stats.clients,
      description: 'Пользователи с ролью CLIENT'
    },
    {
      title: 'Монтажёров',
      value: stats.editors,
      description: 'Пользователи с ролью EDITOR'
    },
    {
      title: 'Заказов',
      value: stats.orders,
      description: 'Все созданные заказы'
    },
    {
      title: 'Услуг',
      value: stats.services,
      description: 'Услуги монтажёров'
    },
    {
      title: 'Отзывов',
      value: stats.reviews,
      description: 'Отзывы заказчиков'
    }
  ];

  return (
    <div className="page">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Панель администратора</h2>

        <p>
          <strong>Администратор:</strong>{' '}
          {user?.full_name || user?.email || 'Администратор'}
        </p>

        <p className="empty-text">
          Здесь отображается статистика платформы и быстрый доступ к разделам управления.
        </p>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Управление</h3>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <Link to="/admin/users">
            <button>
              Пользователи
            </button>
          </Link>

          <Link to="/admin/orders">
            <button>
              Заказы
            </button>
          </Link>

          <Link to="/admin/reviews">
            <button>
              Отзывы
            </button>
          </Link>

          <Link to="/admin/complaints">
            <button>Жалобы</button>
          </Link>
        </div>
      </div>

      <h3>Статистика системы</h3>

      {loading ? (
        <div className="card">
          <p className="empty-text">Загрузка статистики...</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px'
          }}
        >
          {statCards.map((item) => (
            <div
              key={item.title}
              className="card"
              style={{
                minHeight: '140px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <h3 style={{ marginTop: 0 }}>
                  {item.title}
                </h3>

                <p className="empty-text">
                  {item.description}
                </p>
              </div>

              <div
                style={{
                  fontSize: '34px',
                  fontWeight: '700',
                  color: '#60a5fa'
                }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
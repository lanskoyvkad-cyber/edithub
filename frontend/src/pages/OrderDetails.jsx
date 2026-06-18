import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [message, setMessage] = useState('');

  const user = JSON.parse(localStorage.getItem('user'));

  const getOrderStatus = (status) => {
    if (status === 'OPEN') {
      return {
        text: 'Открыт',
        className: 'status status-open'
      };
    }

    if (status === 'IN_PROGRESS') {
      return {
        text: 'В работе',
        className: 'status status-progress'
      };
    }

    if (status === 'COMPLETED') {
      return {
        text: 'Завершён',
        className: 'status status-completed'
      };
    }

    if (status === 'CANCELLED') {
      return {
        text: 'Отменён',
        className: 'status status-cancelled'
      };
    }

    return {
      text: status || 'Неизвестно',
      className: 'status status-progress'
    };
  };

  const formatDate = (date) => {
    if (!date) return 'Не указана';

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return 'Не указана';
    }

    return parsedDate.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDeadline = (deadline) => {
    if (!deadline) return 'Не указан';

    const value = String(deadline);

    if (/^\d+$/.test(value)) {
      return `${value} дн.`;
    }

    const parsedDate = new Date(deadline);

    if (Number.isNaN(parsedDate.getTime())) {
      return value;
    }

    return parsedDate.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const loadOrder = async () => {
    try {
      const response = await api.get(`/orders/${orderId}`);

      setOrder(response.data.order || response.data);
    } catch (error) {
      console.error(error);
      setMessage(
        error.response?.data?.message ||
        'Ошибка загрузки заказа'
      );
    }
  };

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  if (message) {
    return (
      <div className="page">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Заказ №{orderId}</h2>

          <p style={{ color: '#fca5a5' }}>
            {message}
          </p>

          <button onClick={() => navigate(-1)}>
            Назад
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Загрузка заказа...</h2>
        </div>
      </div>
    );
  }

  const statusInfo = getOrderStatus(order.status);

  const isOrderOwner =
    user?.role === 'CLIENT' &&
    Number(user?.user_id) === Number(order.user_id);

  return (
    <div className="page">
      <div
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '15px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}
      >
        <div>
          <h2 style={{ marginTop: 0, marginBottom: '6px' }}>
            Детали заказа
          </h2>

          <p className="empty-text" style={{ margin: 0 }}>
            Подробная информация о заказе №{order.order_id || orderId}
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{ background: '#374151' }}
        >
          Назад
        </button>
      </div>

      <div className="card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '15px',
            alignItems: 'flex-start',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ flex: 1, minWidth: '260px' }}>
            <h2 style={{ marginTop: 0 }}>
              {order.title || `Заказ №${orderId}`}
            </h2>

            <p className="empty-text">
              ID заказа: {order.order_id || orderId}
            </p>
          </div>

          <span className={statusInfo.className}>
            {statusInfo.text}
          </span>
        </div>

        <hr />

        <h3>Описание заказа</h3>

        <div
          style={{
            background: '#0f172a',
            border: '1px solid #374151',
            borderRadius: '12px',
            padding: '15px'
          }}
        >
          <p style={{ margin: 0 }}>
            {order.description || 'Описание не указано'}
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            marginTop: '20px'
          }}
        >
          <span className="status status-progress">
            Бюджет: {order.budget || 0} ₽
          </span>

          <span className="status status-completed">
            Срок: {formatDeadline(order.deadline)}
          </span>

          <span className="status status-open">
            Тип видео: {order.video_type || 'Не указан'}
          </span>
        </div>
      </div>

      <div
        className="card"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px'
        }}
      >
        <div>
          <h3 style={{ marginTop: 0 }}>Заказчик</h3>

          <p>
            <strong>Имя:</strong>{' '}
            {order.client_name || order.user_name || 'Не указан'}
          </p>

          {order.client_email && (
            <p>
              <strong>Email:</strong> {order.client_email}
            </p>
          )}
        </div>

        <div>
          <h3 style={{ marginTop: 0 }}>Информация</h3>

          <p>
            <strong>Дата создания:</strong>{' '}
            {formatDate(order.created_at)}
          </p>

          <p>
            <strong>Статус:</strong>{' '}
            {statusInfo.text}
          </p>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Действия</h3>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap'
          }}
        >
          <Link to="/orders">
            <button>
              К списку заказов
            </button>
          </Link>

          {isOrderOwner && (
            <Link to={`/orders/${order.order_id}/applications`}>
              <button>
                Смотреть отклики
              </button>
            </Link>
          )}

          {user?.role === 'EDITOR' && order.status === 'OPEN' && (
            <Link to="/orders">
              <button>
                Перейти к бирже заказов
              </button>
            </Link>
          )}

          {user?.role === 'ADMIN' && (
            <Link to="/admin/orders">
              <button>
                В управление заказами
              </button>
            </Link>
          )}
        </div>

        {user?.role === 'EDITOR' && order.status !== 'OPEN' && (
          <p className="empty-text" style={{ marginTop: '15px' }}>
            Заказ уже не находится в открытом статусе, поэтому откликнуться на него нельзя.
          </p>
        )}

        {!user && (
          <p className="empty-text" style={{ marginTop: '15px' }}>
            Для отклика на заказ необходимо войти в аккаунт монтажёра.
          </p>
        )}
      </div>
    </div>
  );
}

export default OrderDetails;
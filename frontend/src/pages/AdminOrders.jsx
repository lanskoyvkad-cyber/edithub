import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const token = localStorage.getItem('token');

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

  const loadOrders = async () => {
    try {
      const response = await api.get('/orders');
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error(error);
      alert('Ошибка загрузки заказов');
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const deleteOrder = async (order) => {
    const confirmed = window.confirm(
      `Удалить заказ "${order.title || 'Без названия'}"?`
    );

    if (!confirmed) return;

    try {
      await api.delete(`/orders/admin/${order.order_id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      alert('Заказ удалён');
      loadOrders();

    } catch (error) {
      alert(error.response?.data?.message || 'Ошибка удаления заказа');
    }
  };

  const filteredOrders = orders.filter((order) => {
    const text = `
      ${order.order_id || ''}
      ${order.title || ''}
      ${order.description || ''}
      ${order.client_name || ''}
      ${order.video_type || ''}
      ${order.status || ''}
    `.toLowerCase();

    const matchesSearch = text.includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="page">
      <h2>Управление заказами</h2>

      <div
        className="card"
        style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}
      >
        <input
          placeholder="Поиск по названию, описанию, заказчику или типу видео"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: '280px'
          }}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">Все статусы</option>
          <option value="OPEN">Открытые</option>
          <option value="IN_PROGRESS">В работе</option>
          <option value="COMPLETED">Завершённые</option>
          <option value="CANCELLED">Отменённые</option>
        </select>
      </div>

      <div
        className="card"
        style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap'
        }}
      >
        <span className="status status-progress">
          Всего: {orders.length}
        </span>

        <span className="status status-open">
          Открытых: {orders.filter((order) => order.status === 'OPEN').length}
        </span>

        <span className="status status-progress">
          В работе: {orders.filter((order) => order.status === 'IN_PROGRESS').length}
        </span>

        <span className="status status-completed">
          Завершённых: {orders.filter((order) => order.status === 'COMPLETED').length}
        </span>

        <span className="status status-cancelled">
          Отменённых: {orders.filter((order) => order.status === 'CANCELLED').length}
        </span>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="card">
          <p className="empty-text">Заказы не найдены.</p>
        </div>
      ) : (
        filteredOrders.map((order) => {
          const statusInfo = getOrderStatus(order.status);

          return (
            <div
              key={order.order_id}
              className="card"
            >
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
                  <h3 style={{ marginTop: 0 }}>
                    {order.title || 'Заказ без названия'}
                  </h3>

                  <p className="empty-text">
                    ID заказа: {order.order_id}
                  </p>

                  <p>
                    {order.description || 'Описание не указано'}
                  </p>
                </div>

                <span className={statusInfo.className}>
                  {statusInfo.text}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  flexWrap: 'wrap',
                  margin: '12px 0'
                }}
              >
                <span className="status status-progress">
                  Бюджет: {order.budget || 0} ₽
                </span>

                <span className="status status-completed">
                  Срок: {order.deadline || 0} дн.
                </span>

                <span className="status status-open">
                  Тип видео: {order.video_type || 'Не указан'}
                </span>
              </div>

              <div
                style={{
                  background: '#0f172a',
                  border: '1px solid #374151',
                  borderRadius: '12px',
                  padding: '14px',
                  marginTop: '12px'
                }}
              >
                <p>
                  <strong>Заказчик:</strong>{' '}
                  {order.client_name || order.user_name || 'Не указан'}
                </p>

                {order.client_email && (
                  <p>
                    <strong>Email заказчика:</strong>{' '}
                    {order.client_email}
                  </p>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  flexWrap: 'wrap',
                  marginTop: '15px'
                }}
              >
                <Link to={`/orders/${order.order_id}`}>
                  <button>
                    Открыть заказ
                  </button>
                </Link>

                <button
                  onClick={() => deleteOrder(order)}
                >
                  Удалить заказ
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default AdminOrders;
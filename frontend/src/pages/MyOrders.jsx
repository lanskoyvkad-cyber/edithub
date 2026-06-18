import { useEffect, useState } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [editingOrder, setEditingOrder] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    budget: '',
    deadline: '',
    video_type: ''
  });

  const token = localStorage.getItem('token');

  const statusLabels = {
    OPEN: 'Открыт',
    IN_PROGRESS: 'В работе',
    COMPLETED: 'Завершён',
    CANCELLED: 'Отменён'
  };

  const statusClassNames = {
    OPEN: 'status status-open',
    IN_PROGRESS: 'status status-progress',
    COMPLETED: 'status status-completed',
    CANCELLED: 'status status-cancelled'
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

  const getDateForInput = (date) => {
    if (!date) return '';

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return '';
    }

    return parsedDate.toISOString().split('T')[0];
  };

  const loadOrders = async () => {
    try {
      const response = await api.get('/orders/my', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setOrders(response.data.orders || []);

    } catch (error) {
      console.error(error);
      setMessage('Ошибка загрузки заказов');
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const startEdit = (order) => {
    setEditingOrder(order.order_id);
    setMessage('');

    setForm({
      title: order.title || '',
      description: order.description || '',
      budget: order.budget || '',
      deadline: getDateForInput(order.deadline),
      video_type: order.video_type || ''
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingOrder(null);

    setForm({
      title: '',
      description: '',
      budget: '',
      deadline: '',
      video_type: ''
    });
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const updateOrder = async (e) => {
    e.preventDefault();

    try {
      await api.put(
        `/orders/${editingOrder}`,
        {
          ...form,
          budget: Number(form.budget)
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMessage('Заказ обновлён');

      cancelEdit();
      loadOrders();

    } catch (error) {
      setMessage(error.response?.data?.message || 'Ошибка обновления заказа');
    }
  };

  const deleteOrder = async (order) => {
    const confirmed = window.confirm(
      `Удалить заказ "${order.title || 'Без названия'}"?`
    );

    if (!confirmed) return;

    try {
      await api.delete(`/orders/${order.order_id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setMessage('Заказ удалён');
      loadOrders();

    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        'Ошибка удаления заказа'
      );
    }
  };

  const completeOrder = async (orderId) => {
    const confirmed = window.confirm(
      'Завершить заказ? После этого можно будет оставить отзыв исполнителю.'
    );

    if (!confirmed) return;

    try {
      await api.patch(
        `/orders/${orderId}/complete`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMessage('Заказ завершён');
      loadOrders();

    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        'Ошибка завершения заказа'
      );
    }
  };

  const filteredOrders = orders.filter((order) => {
    const text = `
      ${order.order_id || ''}
      ${order.title || ''}
      ${order.description || ''}
      ${order.video_type || ''}
      ${order.accepted_editor_name || ''}
      ${order.status || ''}
    `.toLowerCase();

    const matchesSearch = text.includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="page">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>
          Мои заказы
        </h2>

        <p className="empty-text">
          Здесь отображаются все ваши заказы, их статусы, выбранные исполнители,
          отклики и отзывы.
        </p>
      </div>

      {message && (
        <div className="card">
          <strong>{message}</strong>
        </div>
      )}

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
          placeholder="Поиск по названию, описанию, типу видео или исполнителю"
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
      </div>

      {editingOrder && (
        <form
          onSubmit={updateOrder}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            maxWidth: '700px',
            margin: '0 auto 25px'
          }}
        >
          <h3 style={{ marginTop: 0 }}>
            Редактировать заказ
          </h3>

          <input
            name="title"
            placeholder="Название"
            value={form.title}
            onChange={handleChange}
            required
          />

          <textarea
            name="description"
            placeholder="Описание"
            value={form.description}
            onChange={handleChange}
            rows="5"
            required
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px'
            }}
          >
            <input
              name="budget"
              type="number"
              min="1"
              placeholder="Бюджет"
              value={form.budget}
              onChange={handleChange}
              required
            />

            <input
              name="deadline"
              type="date"
              value={form.deadline}
              onChange={handleChange}
              required
            />
          </div>

          <input
            name="video_type"
            placeholder="Тип видео"
            value={form.video_type}
            onChange={handleChange}
            required
          />

          <div>
            <button type="submit">
              Сохранить изменения
            </button>

            <button
              type="button"
              onClick={cancelEdit}
              style={{
                marginLeft: '10px',
                background: '#374151'
              }}
            >
              Отмена
            </button>
          </div>
        </form>
      )}

      {filteredOrders.length === 0 ? (
        <div className="card">
          <p className="empty-text">
            Заказы не найдены.
          </p>

          <Link to="/create-order">
            <button>
              Создать заказ
            </button>
          </Link>
        </div>
      ) : (
        filteredOrders.map((order) => (
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

              <span className={statusClassNames[order.status] || 'status'}>
                {statusLabels[order.status] || order.status}
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
                Срок: {formatDeadline(order.deadline)}
              </span>

              <span className="status status-open">
                Тип видео: {order.video_type || 'Не указан'}
              </span>

              {order.created_at && (
                <span className="status status-progress">
                  Создан: {formatDate(order.created_at)}
                </span>
              )}
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
              {order.accepted_editor_name ? (
                <p style={{ margin: 0 }}>
                  <strong>Исполнитель:</strong>{' '}
                  {order.accepted_editor_id ? (
                    <Link to={`/editors/${order.accepted_editor_id}`}>
                      {order.accepted_editor_name}
                    </Link>
                  ) : (
                    order.accepted_editor_name
                  )}
                </p>
              ) : (
                <p className="empty-text" style={{ margin: 0 }}>
                  Исполнитель ещё не выбран.
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

              <Link to={`/orders/${order.order_id}/applications`}>
                <button>
                  Посмотреть отклики
                </button>
              </Link>

              {order.status === 'OPEN' && (
                <>
                  <button onClick={() => startEdit(order)}>
                    Редактировать
                  </button>

                  <button onClick={() => deleteOrder(order)}>
                    Удалить
                  </button>
                </>
              )}

              {order.status === 'IN_PROGRESS' && (
                <button onClick={() => completeOrder(order.order_id)}>
                  Завершить заказ
                </button>
              )}

              {order.status === 'COMPLETED' &&
                order.accepted_editor_id &&
                !order.review_id && (
                  <Link
                    to={`/reviews/create/${order.order_id}/${order.accepted_editor_id}`}
                  >
                    <button>
                      Оставить отзыв
                    </button>
                  </Link>
                )}
            </div>

            {order.review_id && (
              <p style={{ marginTop: '12px', color: '#86efac' }}>
                Отзыв оставлен.
              </p>
            )}

            {order.status === 'COMPLETED' && !order.accepted_editor_id && (
              <p className="empty-text" style={{ marginTop: '12px' }}>
                Заказ завершён без выбранного исполнителя.
              </p>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default MyOrders;
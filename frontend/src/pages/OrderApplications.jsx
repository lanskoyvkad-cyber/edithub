import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

function OrderApplications() {
  const { orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [applications, setApplications] = useState([]);
  const [message, setMessage] = useState('');

  const token = localStorage.getItem('token');

  const getApplicationStatus = (status) => {
    if (status === 'ACCEPTED') {
      return {
        text: 'Принят',
        className: 'status status-open'
      };
    }

    if (status === 'REJECTED') {
      return {
        text: 'Отклонён',
        className: 'status status-cancelled'
      };
    }

    return {
      text: 'На рассмотрении',
      className: 'status status-progress'
    };
  };

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

  const loadOrder = async () => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setOrder(response.data.order);
    } catch (error) {
      console.error(error);
    }
  };

  const loadApplications = async () => {
    try {
      const response = await api.get(`/applications/order/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setApplications(response.data.applications || []);
    } catch (error) {
      console.error(error);
      setMessage('Ошибка загрузки откликов');
    }
  };

  useEffect(() => {
    loadOrder();
    loadApplications();
  }, [orderId]);

  const acceptApplication = async (applicationId) => {
    const confirmed = window.confirm(
      'Принять этот отклик? После этого заказ будет переведён в работу, а остальные отклики будут отклонены.'
    );

    if (!confirmed) return;

    try {
      await api.patch(
        `/applications/${applicationId}/status`,
        {
          status: 'ACCEPTED'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMessage('Отклик принят. Заказ переведён в работу.');

      loadOrder();
      loadApplications();

    } catch (error) {
      setMessage(error.response?.data?.message || 'Ошибка принятия отклика');
    }
  };

  const hasAcceptedApplication = applications.some(
    (application) => application.status === 'ACCEPTED'
  );

  return (
    <div className="page">
      <h2>Отклики на заказ №{orderId}</h2>

      {message && (
        <div className="card">
          <strong>{message}</strong>
        </div>
      )}

      {order && (
        <div className="card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '15px',
              flexWrap: 'wrap',
              alignItems: 'flex-start'
            }}
          >
            <div>
              <h3 style={{ marginTop: 0 }}>
                {order.title || 'Заказ'}
              </h3>

              <p>
                {order.description || 'Описание не указано'}
              </p>
            </div>

            <span className={getOrderStatus(order.status).className}>
              {getOrderStatus(order.status).text}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap',
              marginTop: '10px'
            }}
          >
            <span className="status status-progress">
              Бюджет: {order.budget || 0} ₽
            </span>

            <span className="status status-completed">
              Срок: {order.deadline || 0} дн.
            </span>

            <span className="status status-open">
              Откликов: {applications.length}
            </span>
          </div>
        </div>
      )}

      {applications.length === 0 ? (
        <div className="card">
          <p className="empty-text">Откликов пока нет.</p>
        </div>
      ) : (
        applications.map((application) => {
          const statusInfo = getApplicationStatus(application.status);

          return (
            <div
              key={application.application_id}
              className="card"
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '15px',
                  flexWrap: 'wrap',
                  alignItems: 'flex-start'
                }}
              >
                <div>
                  <h3 style={{ marginTop: 0 }}>
                    <Link to={`/editors/${application.user_id}`}>
                      {application.editor_name || 'Монтажёр'}
                    </Link>
                  </h3>

                  <p>
                    <strong>Город:</strong>{' '}
                    {application.editor_city || 'Не указан'}
                  </p>

                  <p>
                    <strong>Email:</strong>{' '}
                    {application.editor_email || 'Не указан'}
                  </p>
                </div>

                <span className={statusInfo.className}>
                  {statusInfo.text}
                </span>
              </div>

              <div
                style={{
                  background: '#0f172a',
                  border: '1px solid #374151',
                  borderRadius: '12px',
                  padding: '14px',
                  marginTop: '12px',
                  marginBottom: '15px'
                }}
              >
                <strong>Сообщение монтажёра:</strong>

                <p style={{ marginBottom: 0 }}>
                  {application.message || 'Сообщение не указано'}
                </p>
              </div>

              {application.status === 'PENDING' && !hasAcceptedApplication && (
                <button
                  onClick={() => acceptApplication(application.application_id)}
                >
                  Принять отклик
                </button>
              )}

              {application.status === 'PENDING' && hasAcceptedApplication && (
                <p className="empty-text">
                  Исполнитель для этого заказа уже выбран.
                </p>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

export default OrderApplications;
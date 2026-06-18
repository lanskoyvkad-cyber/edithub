import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function MyApplications() {
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

  const loadApplications = async () => {
    try {
      const response = await api.get('/applications/my', {
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
    loadApplications();
  }, []);

  return (
    <div className="page">
      <h2>Мои отклики</h2>

      {message && (
        <div className="card">
          <strong>{message}</strong>
        </div>
      )}

      {applications.length === 0 ? (
        <div className="card">
          <p className="empty-text">У вас пока нет откликов.</p>
        </div>
      ) : (
        applications.map((application) => {
          const applicationStatus = getApplicationStatus(application.status);
          const orderStatus = getOrderStatus(application.order_status);

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
                  alignItems: 'flex-start',
                  flexWrap: 'wrap'
                }}
              >
                <div>
                  <h3 style={{ marginTop: 0 }}>
                    {application.order_title || 'Заказ'}
                  </h3>

                  <p>
                    {application.order_description || 'Описание не указано'}
                  </p>
                </div>

                <span className={applicationStatus.className}>
                  {applicationStatus.text}
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
                  Бюджет: {application.budget || 0} ₽
                </span>

                <span className="status status-completed">
                  Тип видео: {application.video_type || 'Не указан'}
                </span>

                <span className={orderStatus.className}>
                  Заказ: {orderStatus.text}
                </span>
              </div>

              {application.message && (
                <div
                  style={{
                    background: '#0f172a',
                    border: '1px solid #374151',
                    borderRadius: '12px',
                    padding: '14px',
                    marginTop: '12px'
                  }}
                >
                  <strong>Ваше сообщение заказчику:</strong>

                  <p style={{ marginBottom: 0 }}>
                    {application.message}
                  </p>
                </div>
              )}

              {application.status === 'ACCEPTED' && (
                <p style={{ marginTop: '15px', color: '#86efac' }}>
                  Ваш отклик принят. Заказчик выбрал вас исполнителем.
                </p>
              )}

              {application.status === 'REJECTED' && (
                <p style={{ marginTop: '15px', color: '#fca5a5' }}>
                  Этот отклик был отклонён.
                </p>
              )}

              {application.status === 'PENDING' && (
                <p style={{ marginTop: '15px' }} className="empty-text">
                  Отклик ожидает решения заказчика.
                </p>
              )}

              {application.order_id && (
                <Link to={`/orders/${application.order_id}`}>
                  <button style={{ marginTop: '10px' }}>
                    Открыть заказ
                  </button>
                </Link>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

export default MyApplications;
import { useEffect, useState } from 'react';
import api from '../services/api';

function Notifications() {
  const token = localStorage.getItem('token');

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const response = await api.get('/notifications', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setNotifications(response.data.notifications || []);

    } catch (error) {
      console.error(error);
      alert(
        error.response?.data?.message ||
        'Ошибка загрузки уведомлений'
      );
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.patch(
        `/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setNotifications((prev) =>
        prev.map((item) =>
          item.notification_id === notificationId
            ? { ...item, is_read: true }
            : item
        )
      );

    } catch (error) {
      console.error(error);
      alert('Ошибка обновления уведомления');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch(
        '/notifications/read-all',
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setNotifications((prev) =>
        prev.map((item) => ({
          ...item,
          is_read: true
        }))
      );

    } catch (error) {
      console.error(error);
      alert('Ошибка обновления уведомлений');
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  if (loading) {
    return (
      <div className="page">
        <div className="card">
          <h2>Загрузка уведомлений...</h2>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  return (
    <div className="page">
      <div
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}
      >
        <div>
          <h2 style={{ marginTop: 0 }}>Уведомления</h2>
          <p className="empty-text">
            Непрочитанных: {unreadCount}
          </p>
        </div>

        {notifications.length > 0 && (
          <button onClick={markAllAsRead}>
            Отметить все как прочитанные
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card">
          <p className="empty-text">Уведомлений пока нет.</p>
        </div>
      ) : (
        notifications.map((notification) => (
          <div
            key={notification.notification_id}
            className="card"
            style={{
              border: notification.is_read
                ? '1px solid #1f2937'
                : '1px solid #2563eb'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap'
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                {notification.title}
              </h3>

              <span
                className={
                  notification.is_read
                    ? 'status status-completed'
                    : 'status status-progress'
                }
              >
                {notification.is_read ? 'Прочитано' : 'Новое'}
              </span>
            </div>

            <p>{notification.message}</p>

            <p className="empty-text">
              {new Date(notification.created_at).toLocaleString('ru-RU')}
            </p>

            {!notification.is_read && (
              <button
                type="button"
                onClick={() => markAsRead(notification.notification_id)}
              >
                Отметить как прочитанное
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default Notifications;
import { Link } from 'react-router-dom';

function EditorDashboard() {
  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <div className="page">
      <div
        className="card"
        style={{
          textAlign: 'center',
          padding: '35px'
        }}
      >
        <h2 style={{ marginTop: 0 }}>
          Кабинет монтажёра
        </h2>

        <p className="empty-text">
          Здравствуйте, {user?.full_name || user?.email || 'монтажёр'}.
          Здесь собраны основные действия для поиска заказов и развития профиля.
        </p>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginTop: '20px'
          }}
        >
          <Link to="/orders">
            <button>Биржа заказов</button>
          </Link>

          <Link to="/my-applications">
            <button>Мои отклики</button>
          </Link>

          <Link to="/profile">
            <button>Мой профиль</button>
          </Link>

          <Link to="/chats">
            <button>Чаты</button>
          </Link>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px'
        }}
      >
        <div className="card">
          <h3>Поиск заказов</h3>
          <p className="empty-text">
            Просматривайте открытые заказы на бирже и выбирайте подходящие проекты.
          </p>
        </div>

        <div className="card">
          <h3>Отклики</h3>
          <p className="empty-text">
            Оставляйте сообщения заказчикам и отслеживайте статусы своих откликов.
          </p>
        </div>

        <div className="card">
          <h3>Профиль и портфолио</h3>
          <p className="empty-text">
            Заполняйте информацию о себе, добавляйте услуги и примеры выполненных работ.
          </p>
        </div>
      </div>
    </div>
  );
}

export default EditorDashboard;
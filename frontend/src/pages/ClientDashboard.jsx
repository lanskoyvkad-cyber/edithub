import { Link } from 'react-router-dom';

function ClientDashboard() {
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
          Кабинет заказчика
        </h2>

        <p className="empty-text">
          Здравствуйте, {user?.full_name || user?.email || 'заказчик'}.
          Здесь собраны основные действия для работы с заказами.
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
          <Link to="/create-order">
            <button>Создать заказ</button>
          </Link>

          <Link to="/orders">
            <button>Посмотреть заказы</button>
          </Link>

          <Link to="/my-orders">
            <button>Мои заказы</button>
          </Link>

          <Link to="/editors">
            <button>Найти монтажёра</button>
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
          <h3>Создание заказа</h3>
          <p className="empty-text">
            Опишите задачу, бюджет, срок и тип видео, чтобы монтажёры могли откликнуться.
          </p>
        </div>

        <div className="card">
          <h3>Выбор исполнителя</h3>
          <p className="empty-text">
            Просматривайте отклики и выбирайте подходящего монтажёра для работы.
          </p>
        </div>

        <div className="card">
          <h3>Отзывы</h3>
          <p className="empty-text">
            После завершения заказа можно оставить отзыв исполнителю.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ClientDashboard;
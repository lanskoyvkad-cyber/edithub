import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

import Register from './pages/Register';
import Login from './pages/Login';
import Orders from './pages/Orders';
import CreateOrder from './pages/CreateOrder';
import ClientDashboard from './pages/ClientDashboard';
import EditorDashboard from './pages/EditorDashboard';
import AdminDashboard from './pages/AdminDashboard';

import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import OrderApplications from './pages/OrderApplications';
import MyApplications from './pages/MyApplications';
import MyOrders from './pages/MyOrders';
import CreateReview from './pages/CreateReview';
import Chats from './pages/Chats';
import OrderDetails from './pages/OrderDetails';

import AdminUsers from './pages/AdminUsers';
import AdminOrders from './pages/AdminOrders';
import AdminReviews from './pages/AdminReviews';

import EditorReviews from './pages/EditorReviews';
import Profile from './pages/Profile';
import EditorPublicProfile from './pages/EditorPublicProfile';
import Editors from './pages/Editors';

function Home() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token || !user) {
    return (
      <div className="page">
        <div
          className="card"
          style={{
            padding: '40px',
            textAlign: 'center'
          }}
        >
          <h1 style={{ marginTop: 0 }}>
            EditHub 
          </h1>

          <p
            className="empty-text"
            style={{
              fontSize: '18px',
              maxWidth: '760px',
              margin: '0 auto 25px'
            }}
          >
            Сервис для поиска заказчиков и специалистов по видеомонтажу.
            Заказчики создают заказы и выбирают исполнителей, а монтажёры
            находят проекты, оформляют профиль и показывают портфолио.
          </p>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}
          >
            <Link to="/editors">
              <button>Посмотреть монтажёров</button>
            </Link>

            <Link to="/orders">
              <button>Посмотреть заказы</button>
            </Link>

            <Link to="/register">
              <button>Зарегистрироваться</button>
            </Link>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px'
          }}
        >
          <div className="card">
            <h3>Для заказчиков</h3>

            <p>
              Создавайте заказы на видеомонтаж, получайте отклики от исполнителей,
              выбирайте подходящего монтажёра и оставляйте отзывы после завершения работы.
            </p>

            <div
              style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                marginTop: '12px'
              }}
            >
              <span className="status status-open">Создание заказов</span>
              <span className="status status-progress">Выбор исполнителя</span>
              <span className="status status-completed">Отзывы</span>
            </div>
          </div>

          <div className="card">
            <h3>Для монтажёров</h3>

            <p>
              Оформляйте профиль, добавляйте услуги и портфолио, откликайтесь
              на заказы и общайтесь с заказчиками в чате.
            </p>

            <div
              style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                marginTop: '12px'
              }}
            >
              <span className="status status-open">Портфолио</span>
              <span className="status status-progress">Отклики</span>
              <span className="status status-completed">Чаты</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Возможности платформы</h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px'
            }}
          >
            <div className="card">
              <h4>Каталог монтажёров</h4>
              <p className="empty-text">
                Просмотр профилей, рейтингов, услуг и портфолио специалистов.
              </p>
            </div>

            <div className="card">
              <h4>Биржа заказов</h4>
              <p className="empty-text">
                Заказчики публикуют задачи, а монтажёры оставляют отклики.
              </p>
            </div>

            <div className="card">
              <h4>Чаты</h4>
              <p className="empty-text">
                Заказчик и выбранный монтажёр могут общаться внутри системы.
              </p>
            </div>

            <div className="card">
              <h4>Система отзывов</h4>
              <p className="empty-text">
                Оценка качества, сроков и коммуникации после завершения заказа.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (user.role === 'CLIENT') {
    return (
      <div className="page">
        <div
          className="card"
          style={{
            padding: '35px',
            textAlign: 'center'
          }}
        >
          <h1 style={{ marginTop: 0 }}>
            Добро пожаловать, {user.full_name || user.email}
          </h1>

          <p className="empty-text">
            Вы можете создать новый заказ, найти монтажёра или перейти к своим заказам.
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

            <Link to="/editors">
              <button>Найти монтажёра</button>
            </Link>

            <Link to="/my-orders">
              <button>Мои заказы</button>
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
            <h3>1. Создайте заказ</h3>
            <p className="empty-text">
              Опишите задачу, бюджет, срок и тип видео.
            </p>
          </div>

          <div className="card">
            <h3>2. Получите отклики</h3>
            <p className="empty-text">
              Монтажёры смогут предложить свои услуги.
            </p>
          </div>

          <div className="card">
            <h3>3. Выберите исполнителя</h3>
            <p className="empty-text">
              После выбора исполнителя заказ перейдёт в работу.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (user.role === 'EDITOR') {
    return (
      <div className="page">
        <div
          className="card"
          style={{
            padding: '35px',
            textAlign: 'center'
          }}
        >
          <h1 style={{ marginTop: 0 }}>
            Добро пожаловать, {user.full_name || user.email}
          </h1>

          <p className="empty-text">
            Вы можете просматривать заказы, откликаться на них и развивать свой профиль монтажёра.
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
            <h3>1. Оформите профиль</h3>
            <p className="empty-text">
              Добавьте описание, услуги и портфолио.
            </p>
          </div>

          <div className="card">
            <h3>2. Откликайтесь на заказы</h3>
            <p className="empty-text">
              Находите подходящие проекты на бирже заказов.
            </p>
          </div>

          <div className="card">
            <h3>3. Получайте отзывы</h3>
            <p className="empty-text">
              После завершения заказов клиенты смогут оценить вашу работу.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (user.role === 'ADMIN') {
    return (
      <div className="page">
        <div
          className="card"
          style={{
            padding: '35px',
            textAlign: 'center'
          }}
        >
          <h1 style={{ marginTop: 0 }}>
            Панель администратора
          </h1>

          <p className="empty-text">
            Управление пользователями, заказами и отзывами доступно в админ-панели.
          </p>

          <Link to="/admin">
            <button>Перейти в админ-панель</button>
          </Link>
        </div>
      </div>
    );
  }

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/register" element={<Register />} />

        <Route path="/login" element={<Login />} />

        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/:orderId" element={<OrderDetails />} />

        <Route
          path="/create-order"
          element={
            <ProtectedRoute roles={['CLIENT']}>
              <CreateOrder />
            </ProtectedRoute>
          }
        />

        <Route
          path="/client"
          element={
            <ProtectedRoute roles={['CLIENT']}>
              <ClientDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/editor"
          element={
            <ProtectedRoute roles={['EDITOR']}>
              <EditorDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders/:orderId/applications"
          element={
            <ProtectedRoute roles={['CLIENT']}>
              <OrderApplications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-applications"
          element={
            <ProtectedRoute roles={['EDITOR']}>
              <MyApplications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-orders"
          element={
            <ProtectedRoute roles={['CLIENT']}>
              <MyOrders />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reviews/create/:orderId/:editorId"
          element={
            <ProtectedRoute roles={['CLIENT']}>
              <CreateReview />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chats"
          element={
            <ProtectedRoute roles={['CLIENT', 'EDITOR']}>
              <Chats />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <AdminOrders />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/reviews"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <AdminReviews />
            </ProtectedRoute>
          }
        />

        <Route
          path="/editor/reviews"
          element={
            <ProtectedRoute roles={['EDITOR']}>
              <EditorReviews />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute roles={['CLIENT', 'EDITOR', 'ADMIN']}>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route path="/editors" element={<Editors />} />
        <Route path="/editors/:id" element={<EditorPublicProfile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
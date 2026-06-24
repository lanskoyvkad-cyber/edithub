import { Link, useNavigate, useLocation } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem('token');

  const savedUser = localStorage.getItem('user');
  const user = savedUser ? JSON.parse(savedUser) : null;

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    window.location.reload();
  };

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }

    return (
      location.pathname === path ||
      location.pathname.startsWith(`${path}/`)
    );
  };

  const navLinkStyle = (path, exact = false) => {
    const active = isActive(path, exact);

    return {
      background: active ? '#2563eb' : 'transparent',
      color: active ? '#ffffff' : '#e5e7eb'
    };
  };

  const renderGuestLinks = () => (
    <>
      <Link to="/editors" style={navLinkStyle('/editors')}>
        Монтажёры
      </Link>

      <Link to="/orders" style={navLinkStyle('/orders')}>
        Заказы
      </Link>

      <Link to="/login" style={navLinkStyle('/login', true)}>
        Вход
      </Link>

      <Link to="/register" style={navLinkStyle('/register', true)}>
        Регистрация
      </Link>
    </>
  );

  const renderClientLinks = () => (
    <>
      <Link to="/editors" style={navLinkStyle('/editors')}>
        Монтажёры
      </Link>

      <Link to="/favorites" style={navLinkStyle('/favorites')}>
      Избранное
    </Link>

      <Link to="/orders" style={navLinkStyle('/orders')}>
        Заказы
      </Link>

      <Link to="/my-orders" style={navLinkStyle('/my-orders')}>
        Мои заказы
      </Link>

      <Link to="/create-order" style={navLinkStyle('/create-order')}>
        Создать заказ
      </Link>

      <Link to="/chats" style={navLinkStyle('/chats')}>
        Чаты
      </Link>

      <Link to="/profile" style={navLinkStyle('/profile')}>
        Профиль
      </Link>
    </>
  );

  const renderEditorLinks = () => (
    <>
      <Link to="/orders" style={navLinkStyle('/orders')}>
        Биржа заказов
      </Link>

      <Link to="/my-applications" style={navLinkStyle('/my-applications')}>
        Мои отклики
      </Link>

      <Link to="/chats" style={navLinkStyle('/chats')}>
        Чаты
      </Link>

      <Link to="/profile" style={navLinkStyle('/profile')}>
        Профиль
      </Link>
    </>
  );

  const renderAdminLinks = () => (
    <>
      <Link to="/admin" style={navLinkStyle('/admin')}>
        Админ-панель
      </Link>

      <Link to="/profile" style={navLinkStyle('/profile')}>
        Профиль
      </Link>
    </>
  );

  return (
    <nav
      style={{
        padding: '14px 24px',
        borderBottom: '1px solid #1f2937',
        background: '#111827',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        flexWrap: 'wrap',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}
    >
      <Link
        to="/"
        style={{
          fontWeight: '800',
          fontSize: '18px',
          color: '#ffffff',
          background: 'transparent',
          padding: '8px 10px',
          marginRight: '8px'
        }}
      >
        EditHub
      </Link>

      <div
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          flexWrap: 'wrap',
          flex: 1
        }}
      >
        <Link to="/" style={navLinkStyle('/', true)}>
          Главная
        </Link>

        {!token && renderGuestLinks()}

        {token && user?.role === 'CLIENT' && renderClientLinks()}

        {token && user?.role === 'EDITOR' && renderEditorLinks()}

        {token && user?.role === 'ADMIN' && renderAdminLinks()}
      </div>

      {token && (
        <button
          onClick={logout}
          style={{
            background: '#dc2626'
          }}
        >
          Выход
        </button>
      )}
    </nav>
  );
}

export default Navbar;
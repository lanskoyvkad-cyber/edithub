import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function Favorites() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  const [editors, setEditors] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = async () => {
    try {
      const response = await api.get('/users/favorites', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setEditors(response.data.editors || []);
    } catch (error) {
      console.error(error);
      alert(
        error.response?.data?.message ||
        'Ошибка загрузки избранных монтажёров'
      );
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (editorId) => {
    const confirmed = window.confirm('Удалить монтажёра из избранного?');

    if (!confirmed) return;

    try {
      await api.delete(`/users/favorites/${editorId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setEditors((prev) =>
        prev.filter((editor) => Number(editor.user_id) !== Number(editorId))
      );
    } catch (error) {
      console.error(error);
      alert(
        error.response?.data?.message ||
        'Ошибка удаления из избранного'
      );
    }
  };

  if (!token) {
    return (
      <div className="page">
        <div className="card">
          <h2>Избранные монтажёры</h2>
          <p>Для просмотра избранного необходимо войти в аккаунт.</p>
        </div>
      </div>
    );
  }

  if (user?.role !== 'CLIENT') {
    return (
      <div className="page">
        <div className="card">
          <h2>Избранные монтажёры</h2>
          <p>Избранные монтажёры доступны только заказчику.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadFavorites();
  }, []);

  if (loading) {
    return (
      <div className="page">
        <div className="card">
          <h2>Загрузка избранных монтажёров...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <h2>Избранные монтажёры</h2>

      {editors.length === 0 ? (
        <div className="card">
          <p className="empty-text">
            Вы пока не добавили монтажёров в избранное.
          </p>

          <Link to="/editors">
            <button>Перейти в каталог монтажёров</button>
          </Link>
        </div>
      ) : (
        editors.map((editor) => (
          <div
            key={editor.user_id}
            className="card"
            style={{
              display: 'flex',
              gap: '20px',
              alignItems: 'flex-start',
              flexWrap: 'wrap'
            }}
          >
            <div>
              {editor.avatar ? (
                <img
                  src={editor.avatar}
                  alt="Аватар"
                  style={{
                    width: '120px',
                    height: '120px',
                    objectFit: 'cover',
                    borderRadius: '50%',
                    border: '2px solid #374151'
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    border: '2px solid #374151',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#111827',
                    color: '#9ca3af'
                  }}
                >
                  Нет фото
                </div>
              )}
            </div>

            <div style={{ flex: 1, minWidth: '260px' }}>
              <h3 style={{ marginTop: 0 }}>
                {editor.full_name || 'Монтажёр'}
              </h3>

              <p>
                <strong>Город:</strong> {editor.city || 'Не указан'}
              </p>

              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  flexWrap: 'wrap',
                  marginBottom: '12px'
                }}
              >
                <span className="status status-progress">
                  ⭐ {Number(editor.average_rating || 0).toFixed(1)} / 5
                </span>

                <span className="status status-open">
                  Отзывов: {editor.reviews_count || 0}
                </span>

                {editor.experience && (
                  <span className="status status-completed">
                    Опыт: {editor.experience}
                  </span>
                )}
              </div>

              {editor.bio ? (
                <p>
                  {editor.bio.length > 180
                    ? editor.bio.slice(0, 180) + '...'
                    : editor.bio}
                </p>
              ) : (
                <p className="empty-text">
                  Монтажёр пока не добавил описание.
                </p>
              )}

              {editor.skills && (
                <p>
                  <strong>Навыки:</strong> {editor.skills}
                </p>
              )}

              {editor.software && (
                <p>
                  <strong>Программы:</strong> {editor.software}
                </p>
              )}

              {editor.video_types && (
                <p>
                  <strong>Типы видео:</strong> {editor.video_types}
                </p>
              )}

              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  flexWrap: 'wrap',
                  marginTop: '12px'
                }}
              >
                <Link to={`/editors/${editor.user_id}`}>
                  <button>Открыть профиль</button>
                </Link>

                <button
                  type="button"
                  onClick={() => removeFavorite(editor.user_id)}
                  style={{ background: '#b45309' }}
                >
                  Удалить из избранного
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default Favorites;
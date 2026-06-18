import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function Editors() {
  const [editors, setEditors] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('rating');

  const loadEditors = async () => {
    try {
      const response = await api.get('/users/editors');
      setEditors(response.data.editors || []);
    } catch (error) {
      console.error(error);
      alert('Ошибка загрузки монтажёров');
    }
  };

  useEffect(() => {
    loadEditors();
  }, []);

  const filteredEditors = editors
    .filter((editor) => {
      const text = `
        ${editor.full_name || ''}
        ${editor.city || ''}
        ${editor.bio || ''}
      `.toLowerCase();

      return text.includes(search.toLowerCase());
    })
    .sort((a, b) => {
      if (sort === 'rating') {
        return Number(b.average_rating) - Number(a.average_rating);
      }

      if (sort === 'reviews') {
        return Number(b.reviews_count) - Number(a.reviews_count);
      }

      if (sort === 'name') {
        return (a.full_name || '').localeCompare(b.full_name || '');
      }

      return 0;
    });

  return (
    <div className="page">
      <h2>Каталог монтажёров</h2>

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
          placeholder="Поиск по имени, городу или описанию"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: '1',
            minWidth: '260px'
          }}
        />

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="rating">Сначала высокий рейтинг</option>
          <option value="reviews">Сначала больше отзывов</option>
          <option value="name">По имени</option>
        </select>
      </div>

      {filteredEditors.length === 0 ? (
        <p className="empty-text">Монтажёры не найдены.</p>
      ) : (
        filteredEditors.map((editor) => (
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
                    color: '#9ca3af',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}
                >
                  Нет фото
                </div>
              )}
            </div>

            <div style={{ flex: '1', minWidth: '260px' }}>
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
                  ⭐ {editor.average_rating || 0} / 5
                </span>

                <span className="status status-open">
                  Отзывов: {editor.reviews_count || 0}
                </span>
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

              <Link to={`/editors/${editor.user_id}`}>
                <button>
                  Открыть профиль
                </button>
              </Link>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default Editors;
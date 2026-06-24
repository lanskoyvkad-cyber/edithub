import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function Editors() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  const [editors, setEditors] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);

  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [videoType, setVideoType] = useState('');
  const [software, setSoftware] = useState('');
  const [sort, setSort] = useState('rating');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const loadEditors = async () => {
    try {
      const response = await api.get('/users/editors');
      setEditors(response.data.editors || []);
    } catch (error) {
      console.error(error);
      alert('Ошибка загрузки монтажёров');
    }
  };

  const loadFavorites = async () => {
    if (!token || user?.role !== 'CLIENT') return;

    try {
      const response = await api.get('/users/favorites', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const ids = (response.data.editors || []).map((editor) =>
        Number(editor.user_id)
      );

      setFavoriteIds(ids);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadEditors();
    loadFavorites();
  }, []);

  const toggleFavorite = async (editorId) => {
    if (!token) {
      alert('Сначала войдите в аккаунт');
      return;
    }

    if (user?.role !== 'CLIENT') {
      alert('Добавлять монтажёров в избранное может только заказчик');
      return;
    }

    const numericId = Number(editorId);
    const isFavorite = favoriteIds.includes(numericId);

    try {
      if (isFavorite) {
        await api.delete(`/users/favorites/${numericId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setFavoriteIds((prev) => prev.filter((id) => id !== numericId));
      } else {
        await api.post(
          `/users/favorites/${numericId}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        setFavoriteIds((prev) => [...prev, numericId]);
      }
    } catch (error) {
      console.error(error);
      alert(
        error.response?.data?.message ||
        'Ошибка при работе с избранным'
      );
    }
  };

  const splitValues = (value) => {
    if (!value) return [];

    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const cities = useMemo(() => {
    return [...new Set(editors.map((editor) => editor.city).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
  }, [editors]);

  const videoTypes = useMemo(() => {
    return [
      ...new Set(editors.flatMap((editor) => splitValues(editor.video_types)))
    ].sort((a, b) => a.localeCompare(b));
  }, [editors]);

  const softwareList = useMemo(() => {
    return [
      ...new Set(editors.flatMap((editor) => splitValues(editor.software)))
    ].sort((a, b) => a.localeCompare(b));
  }, [editors]);

  const resetFilters = () => {
    setSearch('');
    setCity('');
    setVideoType('');
    setSoftware('');
    setSort('rating');
    setOnlyFavorites(false);
  };

  const filteredEditors = editors
    .filter((editor) => {
      const text = `
        ${editor.full_name || ''}
        ${editor.city || ''}
        ${editor.bio || ''}
        ${editor.skills || ''}
        ${editor.software || ''}
        ${editor.video_types || ''}
        ${editor.experience || ''}
      `.toLowerCase();

      const matchesSearch = text.includes(search.toLowerCase());
      const matchesCity = city ? editor.city === city : true;

      const matchesVideoType = videoType
        ? splitValues(editor.video_types).includes(videoType)
        : true;

      const matchesSoftware = software
        ? splitValues(editor.software).includes(software)
        : true;

      const matchesFavorite = onlyFavorites
        ? favoriteIds.includes(Number(editor.user_id))
        : true;

      return (
        matchesSearch &&
        matchesCity &&
        matchesVideoType &&
        matchesSoftware &&
        matchesFavorite
      );
    })
    .sort((a, b) => {
      const ratingA = Number(a.average_rating) || 0;
      const ratingB = Number(b.average_rating) || 0;

      const reviewsA = Number(a.reviews_count) || 0;
      const reviewsB = Number(b.reviews_count) || 0;

      if (sort === 'rating') {
        return ratingB - ratingA;
      }

      if (sort === 'reviews') {
        return reviewsB - reviewsA;
      }

      if (sort === 'name') {
        return (a.full_name || '').localeCompare(b.full_name || '');
      }

      if (sort === 'city') {
        return (a.city || '').localeCompare(b.city || '');
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
          placeholder="Поиск по имени, городу, навыкам или описанию"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: '1',
            minWidth: '260px'
          }}
        />

        <select value={city} onChange={(e) => setCity(e.target.value)}>
          <option value="">Все города</option>
          {cities.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={videoType}
          onChange={(e) => setVideoType(e.target.value)}
        >
          <option value="">Все типы видео</option>
          {videoTypes.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={software}
          onChange={(e) => setSoftware(e.target.value)}
        >
          <option value="">Все программы</option>
          {softwareList.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="rating">Сначала высокий рейтинг</option>
          <option value="reviews">Сначала больше отзывов</option>
          <option value="name">По имени</option>
          <option value="city">По городу</option>
        </select>

        {user?.role === 'CLIENT' && (
          <label
            style={{
              display: 'flex',
              gap: '6px',
              alignItems: 'center',
              cursor: 'pointer'
            }}
          >
            <input
              type="checkbox"
              checked={onlyFavorites}
              onChange={(e) => setOnlyFavorites(e.target.checked)}
            />
            Только избранные
          </label>
        )}

        <button type="button" onClick={resetFilters}>
          Сбросить
        </button>
      </div>

      <p className="empty-text">
        Найдено монтажёров: {filteredEditors.length}
      </p>

      {filteredEditors.length === 0 ? (
        <p className="empty-text">Монтажёры не найдены.</p>
      ) : (
        filteredEditors.map((editor) => {
          const isFavorite = favoriteIds.includes(Number(editor.user_id));

          return (
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

                  {user?.role === 'CLIENT' && (
                    <button
                      type="button"
                      onClick={() => toggleFavorite(editor.user_id)}
                      style={{
                        background: isFavorite ? '#b45309' : '#374151'
                      }}
                    >
                      {isFavorite ? '★ В избранном' : '☆ В избранное'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default Editors;
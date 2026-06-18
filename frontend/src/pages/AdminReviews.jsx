import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('ALL');

  const token = localStorage.getItem('token');

  const loadReviews = async () => {
    try {
      const response = await api.get('/reviews/admin/all', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setReviews(response.data.reviews || []);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Ошибка загрузки отзывов');
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const deleteReview = async (review) => {
    const confirmed = window.confirm(
      `Удалить отзыв от "${review.client_name || 'клиента'}"?`
    );

    if (!confirmed) return;

    try {
      await api.delete(`/reviews/admin/${review.review_id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      alert('Отзыв удалён');
      loadReviews();

    } catch (error) {
      alert(error.response?.data?.message || 'Ошибка удаления отзыва');
    }
  };

  const getRatingInfo = (rating) => {
    const value = Number(rating || 0);

    if (value >= 4.5) {
      return {
        text: `⭐ ${value.toFixed(1)} / 5`,
        className: 'status status-open'
      };
    }

    if (value >= 3) {
      return {
        text: `⭐ ${value.toFixed(1)} / 5`,
        className: 'status status-progress'
      };
    }

    return {
      text: `⭐ ${value.toFixed(1)} / 5`,
      className: 'status status-cancelled'
    };
  };

  const filteredReviews = reviews.filter((review) => {
    const text = `
      ${review.review_id || ''}
      ${review.order_title || ''}
      ${review.client_name || ''}
      ${review.editor_name || ''}
      ${review.comment || ''}
      ${review.rating || ''}
    `.toLowerCase();

    const matchesSearch = text.includes(search.toLowerCase());

    const rating = Number(review.rating || 0);

    let matchesRating = true;

    if (ratingFilter === 'HIGH') {
      matchesRating = rating >= 4;
    }

    if (ratingFilter === 'MEDIUM') {
      matchesRating = rating >= 3 && rating < 4;
    }

    if (ratingFilter === 'LOW') {
      matchesRating = rating < 3;
    }

    return matchesSearch && matchesRating;
  });

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce(
            (sum, review) => sum + Number(review.rating || 0),
            0
          ) / reviews.length
        ).toFixed(1)
      : 0;

  return (
    <div className="page">
      <h2>Модерация отзывов</h2>

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
          placeholder="Поиск по заказу, клиенту, монтажёру или комментарию"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: '280px'
          }}
        />

        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
        >
          <option value="ALL">Все оценки</option>
          <option value="HIGH">Высокие: 4–5</option>
          <option value="MEDIUM">Средние: 3–3.9</option>
          <option value="LOW">Низкие: ниже 3</option>
        </select>
      </div>

      <div
        className="card"
        style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap'
        }}
      >
        <span className="status status-progress">
          Всего отзывов: {reviews.length}
        </span>

        <span className="status status-open">
          Средний рейтинг: ⭐ {averageRating} / 5
        </span>

        <span className="status status-completed">
          Высоких: {reviews.filter((review) => Number(review.rating || 0) >= 4).length}
        </span>

        <span className="status status-cancelled">
          Низких: {reviews.filter((review) => Number(review.rating || 0) < 3).length}
        </span>
      </div>

      {filteredReviews.length === 0 ? (
        <div className="card">
          <p className="empty-text">Отзывы не найдены.</p>
        </div>
      ) : (
        filteredReviews.map((review) => {
          const ratingInfo = getRatingInfo(review.rating);

          return (
            <div
              key={review.review_id}
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
                <div style={{ flex: 1, minWidth: '260px' }}>
                  <h3 style={{ marginTop: 0 }}>
                    {review.order_id ? (
                      <Link to={`/orders/${review.order_id}`}>
                        {review.order_title || 'Заказ'}
                      </Link>
                    ) : (
                      review.order_title || 'Заказ'
                    )}
                  </h3>

                  <p className="empty-text">
                    ID отзыва: {review.review_id}
                  </p>

                  <p>
                    <strong>Клиент:</strong>{' '}
                    {review.client_name || 'Не указан'}
                  </p>

                  <p>
                    <strong>Монтажёр:</strong>{' '}
                    {review.editor_name || 'Не указан'}
                  </p>
                </div>

                <span className={ratingInfo.className}>
                  {ratingInfo.text}
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
                  Качество: {review.quality_rating || 0}
                </span>

                <span className="status status-open">
                  Сроки: {review.deadline_rating || 0}
                </span>

                <span className="status status-completed">
                  Коммуникация: {review.communication_rating || 0}
                </span>
              </div>

              <div
                style={{
                  background: '#0f172a',
                  border: '1px solid #374151',
                  borderRadius: '12px',
                  padding: '14px',
                  marginTop: '12px'
                }}
              >
                <strong>Комментарий:</strong>

                <p style={{ marginBottom: 0 }}>
                  {review.comment || 'Без комментария'}
                </p>
              </div>

              <button
                onClick={() => deleteReview(review)}
                style={{ marginTop: '15px' }}
              >
                Удалить отзыв
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}

export default AdminReviews;
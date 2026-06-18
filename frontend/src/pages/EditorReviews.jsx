import { useEffect, useState } from 'react';
import api from '../services/api';

function EditorReviews() {
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);

  const user = JSON.parse(localStorage.getItem('user'));

  const loadReviews = async () => {
    try {
      const response = await api.get(`/reviews/editor/${user.user_id}`);

      const data = response.data.reviews;
      setReviews(data);

      if (data.length > 0) {
        const sum = data.reduce((acc, review) => acc + Number(review.rating), 0);
        setAverageRating((sum / data.length).toFixed(1));
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Мои отзывы</h2>

      <h3>Средний рейтинг: {averageRating} / 5</h3>

      {reviews.length === 0 ? (
        <p>Отзывов пока нет.</p>
      ) : (
        reviews.map((review) => (
          <div
            key={review.review_id}
            style={{
              border: '1px solid #444',
              borderRadius: '10px',
              padding: '15px',
              marginBottom: '15px'
            }}
          >
            <p><strong>Клиент:</strong> {review.client_name}</p>
            <p><strong>Общая оценка:</strong> {review.rating}</p>
            <p><strong>Качество:</strong> {review.quality_rating}</p>
            <p><strong>Сроки:</strong> {review.deadline_rating}</p>
            <p><strong>Коммуникация:</strong> {review.communication_rating}</p>
            <p><strong>Комментарий:</strong> {review.comment}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default EditorReviews;
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

function CreateReview() {
    const { orderId, editorId } = useParams();
    const navigate = useNavigate();

    const token = localStorage.getItem('token');

    const [form, setForm] = useState({
        quality_rating: 5,
        deadline_rating: 5,
        communication_rating: 5,
        comment: ''
    });

    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const averageRating = (
        (
            Number(form.quality_rating) +
            Number(form.deadline_rating) +
            Number(form.communication_rating)
        ) / 3
    ).toFixed(1);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const setRating = (name, value) => {
        setForm({
            ...form,
            [name]: value
        });
    };

    const ratingButtonStyle = (currentValue, value) => ({
        background: Number(currentValue) === Number(value) ? '#2563eb' : '#374151',
        minWidth: '42px'
    });

    const createReview = async (e) => {
        e.preventDefault();

        setMessage('');
        setIsLoading(true);

        try {
            await api.post(
                '/reviews',
                {
                    order_id: Number(orderId),
                    editor_id: Number(editorId),
                    quality_rating: Number(form.quality_rating),
                    deadline_rating: Number(form.deadline_rating),
                    communication_rating: Number(form.communication_rating),
                    comment: form.comment
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setMessage('Отзыв успешно отправлен');
            setIsSuccess(true);

            setTimeout(() => {
                navigate('/my-orders');
            }, 1000);

        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                'Ошибка отправки отзыва'
            );
            setIsSuccess(false);
            setIsLoading(false);
        }
    };

    const RatingSelector = ({ title, name, value }) => (
        <div
            style={{
                background: '#0f172a',
                border: '1px solid #374151',
                borderRadius: '12px',
                padding: '14px'
            }}
        >
            <strong>{title}</strong>

            <div
                style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                    marginTop: '10px'
                }}
            >
                {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                        key={rating}
                        type="button"
                        onClick={() => setRating(name, rating)}
                        style={ratingButtonStyle(value, rating)}
                    >
                        {rating}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="page">
            <div
                className="card"
                style={{
                    maxWidth: '700px',
                    margin: '0 auto'
                }}
            >
                <h2 style={{ marginTop: 0 }}>
                    Оставить отзыв
                </h2>

                <p className="empty-text">
                    Оцените работу монтажёра по трём критериям. Итоговая оценка
                    будет рассчитана автоматически.
                </p>

                {message && (
                    <div
                        style={{
                            background: isSuccess
                                ? 'rgba(34, 197, 94, 0.12)'
                                : 'rgba(239, 68, 68, 0.12)',
                            border: isSuccess
                                ? '1px solid rgba(34, 197, 94, 0.35)'
                                : '1px solid rgba(239, 68, 68, 0.35)',
                            color: isSuccess ? '#86efac' : '#fca5a5',
                            borderRadius: '10px',
                            padding: '12px',
                            marginBottom: '15px'
                        }}
                    >
                        {message}
                    </div>
                )}

                <form
                    onSubmit={createReview}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px',
                        margin: 0,
                        padding: 0,
                        border: 'none',
                        background: 'transparent'
                    }}
                >
                    <RatingSelector
                        title="Качество работы"
                        name="quality_rating"
                        value={form.quality_rating}
                    />

                    <RatingSelector
                        title="Соблюдение сроков"
                        name="deadline_rating"
                        value={form.deadline_rating}
                    />

                    <RatingSelector
                        title="Коммуникация"
                        name="communication_rating"
                        value={form.communication_rating}
                    />

                    <div
                        style={{
                            display: 'flex',
                            gap: '10px',
                            flexWrap: 'wrap'
                        }}
                    >
                        <span className="status status-progress">
                            Качество: {form.quality_rating}
                        </span>

                        <span className="status status-open">
                            Сроки: {form.deadline_rating}
                        </span>

                        <span className="status status-completed">
                            Коммуникация: {form.communication_rating}
                        </span>

                        <span className="status status-progress">
                            Итог: ⭐ {averageRating} / 5
                        </span>
                    </div>

                    <label>
                        <strong>Комментарий</strong>

                        <textarea
                            name="comment"
                            placeholder="Напишите, что понравилось или что можно улучшить"
                            value={form.comment}
                            onChange={handleChange}
                            rows="5"
                            style={{
                                width: '100%',
                                marginTop: '6px'
                            }}
                        />
                    </label>

                    <div
                        style={{
                            display: 'flex',
                            gap: '10px',
                            flexWrap: 'wrap'
                        }}
                    >
                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                opacity: isLoading ? 0.7 : 1
                            }}
                        >
                            {isLoading ? 'Отправка...' : 'Отправить отзыв'}
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate('/my-orders')}
                            style={{
                                background: '#374151'
                            }}
                        >
                            Назад к заказам
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateReview;
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

function EditorPublicProfile() {
    const { id } = useParams();
    const navigate = useNavigate();

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    const [editor, setEditor] = useState(null);
    const [services, setServices] = useState([]);
    const [portfolio, setPortfolio] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);

    const [activeTab, setActiveTab] = useState('services');
    const [showComplaintForm, setShowComplaintForm] = useState(false);
    const [complaintReason, setComplaintReason] = useState('');
    const [complaintDescription, setComplaintDescription] = useState('');

    const tabButtonStyle = (tabName) => ({
        background: activeTab === tabName ? '#2563eb' : '#374151'
    });

    const getYouTubeEmbedUrl = (url) => {
        if (!url) return null;

        if (url.includes('youtube.com/watch?v=')) {
            const videoId = url.split('v=')[1]?.split('&')[0];
            return `https://www.youtube.com/embed/${videoId}`;
        }

        if (url.includes('youtu.be/')) {
            const videoId = url.split('youtu.be/')[1]?.split('?')[0];
            return `https://www.youtube.com/embed/${videoId}`;
        }

        if (url.includes('youtube.com/shorts/')) {
            const videoId = url.split('shorts/')[1]?.split('?')[0];
            return `https://www.youtube.com/embed/${videoId}`;
        }

        return null;
    };

    const getTikTokEmbedUrl = (url) => {
        if (!url) return null;

        const match = url.match(/video\/(\d+)/);

        if (match && match[1]) {
            return `https://www.tiktok.com/embed/v2/${match[1]}`;
        }

        return null;
    };

    const getInstagramEmbedUrl = (url) => {
        if (!url) return null;

        const match = url.match(/instagram\.com\/(p|reel|reels|tv)\/([^/?#]+)/);

        if (match && match[1] && match[2]) {
            const type = match[1] === 'reels' ? 'reel' : match[1];
            const code = match[2];

            return `https://www.instagram.com/${type}/${code}/embed/`;
        }

        return null;
    };

    const isDirectVideo = (url) => {
        if (!url) return false;

        const cleanUrl = url.split('?')[0].toLowerCase();

        return (
            cleanUrl.endsWith('.mp4') ||
            cleanUrl.endsWith('.webm') ||
            cleanUrl.endsWith('.ogg')
        );
    };

    const getEmbedUrl = (url) => {
        return (
            getYouTubeEmbedUrl(url) ||
            getTikTokEmbedUrl(url) ||
            getInstagramEmbedUrl(url)
        );
    };

    const getEmbedHeight = (url) => {
        if (!url) return '340px';

        if (url.includes('tiktok.com')) {
            return '720px';
        }

        if (url.includes('instagram.com')) {
            return '620px';
        }

        if (url.includes('youtube.com/shorts/')) {
            return '620px';
        }

        return '340px';
    };

    const startChat = async () => {
        try {
            const response = await api.post(
                '/chats',
                {
                    editor_id: Number(id)
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const chatId = response.data.chat?.chat_id;

            if (!chatId) {
                alert('Чат создан, но chat_id не пришёл с backend');
                return;
            }

            navigate(`/chats?chatId=${chatId}`);

        } catch (error) {
            alert(
                error.response?.data?.message ||
                'Ошибка создания чата'
            );
        }
    };

    const sendComplaint = async (e) => {
        e.preventDefault();

        if (!token) {
            alert('Для отправки жалобы необходимо войти в аккаунт');
            return;
        }

        if (!complaintReason.trim()) {
            alert('Укажите причину жалобы');
            return;
        }

        try {
            await api.post(
                '/complaints',
                {
                    target_type: 'USER',
                    target_id: Number(id),
                    reason: complaintReason,
                    description: complaintDescription
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            alert('Жалоба отправлена');

            setComplaintReason('');
            setComplaintDescription('');
            setShowComplaintForm(false);

        } catch (error) {
            console.error(error);
            alert(
                error.response?.data?.message ||
                'Ошибка отправки жалобы'
            );
        }
    };

    useEffect(() => {
        api.get(`/users/editor/${id}`)
            .then((response) => {
                setEditor(response.data.editor);
                setServices(response.data.services || []);
                setPortfolio(response.data.portfolio || []);
                setReviews(response.data.reviews || []);
                setAverageRating(response.data.averageRating || 0);
            })
            .catch((error) => {
                console.error(error);
            });
    }, [id]);

    if (!editor) {
        return (
            <div className="page">
                <div className="card">
                    <h2>Загрузка профиля...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div
                className="card"
                style={{
                    display: 'flex',
                    gap: '24px',
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
                                width: '150px',
                                height: '150px',
                                objectFit: 'cover',
                                borderRadius: '50%',
                                border: '2px solid #374151'
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                width: '150px',
                                height: '150px',
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

                <div style={{ flex: '1', minWidth: '260px' }}>
                    <h2 style={{ marginTop: 0 }}>
                        {editor.full_name || 'Монтажёр'}
                    </h2>

                    <p>
                        <strong>Город:</strong> {editor.city || 'Не указан'}
                    </p>

                    <div
                        style={{
                            display: 'flex',
                            gap: '10px',
                            flexWrap: 'wrap',
                            margin: '12px 0'
                        }}
                    >
                        <span className="status status-progress">
                            ⭐ {averageRating} / 5
                        </span>

                        <span className="status status-open">
                            Отзывов: {reviews.length}
                        </span>

                        <span className="status status-completed">
                            Услуг: {services.length}
                        </span>
                    </div>

                    {editor.bio ? (
                        <div style={{ marginTop: '15px' }}>
                            <h3>О себе</h3>
                            <p>{editor.bio}</p>
                        </div>
                    ) : (
                        <p className="empty-text">
                            Монтажёр пока не добавил описание.
                        </p>
                    )}

                    <div style={{ marginTop: '15px' }}>
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

                        {editor.experience && (
                            <p>
                                <strong>Опыт:</strong> {editor.experience}
                            </p>
                        )}

                        {(editor.telegram || editor.youtube || editor.instagram) && (
                            <div
                                style={{
                                    display: 'flex',
                                    gap: '10px',
                                    flexWrap: 'wrap',
                                    marginTop: '12px'
                                }}
                            >
                                {editor.telegram && (
                                    <a href={editor.telegram} target="_blank" rel="noreferrer">
                                        Telegram
                                    </a>
                                )}

                                {editor.youtube && (
                                    <a href={editor.youtube} target="_blank" rel="noreferrer">
                                        YouTube
                                    </a>
                                )}

                                {editor.instagram && (
                                    <a href={editor.instagram} target="_blank" rel="noreferrer">
                                        Instagram
                                    </a>
                                )}
                            </div>
                        )}
                    </div>

                    {user?.role === 'CLIENT' && (
                        <div
                            style={{
                                display: 'flex',
                                gap: '10px',
                                flexWrap: 'wrap',
                                marginTop: '15px'
                            }}
                        >
                            <button onClick={startChat}>
                                Написать сообщение
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowComplaintForm(!showComplaintForm)}
                                style={{ background: '#b45309' }}
                            >
                                Пожаловаться
                            </button>
                        </div>
                    )}
                    {showComplaintForm && (
                        <div
                            className="card"
                            style={{
                                marginTop: '15px',
                                maxWidth: '600px'
                            }}
                        >
                            <h3 style={{ marginTop: 0 }}>
                                Жалоба на монтажёра
                            </h3>

                            <form
                                onSubmit={sendComplaint}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px'
                                }}
                            >
                                <select
                                    value={complaintReason}
                                    onChange={(e) => setComplaintReason(e.target.value)}
                                    required
                                >
                                    <option value="">Выберите причину</option>
                                    <option value="Неподходящее поведение">
                                        Неподходящее поведение
                                    </option>
                                    <option value="Спам или реклама">
                                        Спам или реклама
                                    </option>
                                    <option value="Недостоверная информация">
                                        Недостоверная информация
                                    </option>
                                    <option value="Оскорбления">
                                        Оскорбления
                                    </option>
                                    <option value="Другое">
                                        Другое
                                    </option>
                                </select>

                                <textarea
                                    placeholder="Опишите проблему подробнее"
                                    value={complaintDescription}
                                    onChange={(e) => setComplaintDescription(e.target.value)}
                                    rows="4"
                                />

                                <div>
                                    <button type="submit">
                                        Отправить жалобу
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setShowComplaintForm(false)}
                                        style={{
                                            marginLeft: '10px',
                                            background: '#374151'
                                        }}
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            <div
                className="card"
                style={{
                    display: 'flex',
                    gap: '10px',
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                }}
            >
                <button
                    type="button"
                    onClick={() => setActiveTab('services')}
                    style={tabButtonStyle('services')}
                >
                    Услуги
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('portfolio')}
                    style={tabButtonStyle('portfolio')}
                >
                    Портфолио
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('reviews')}
                    style={tabButtonStyle('reviews')}
                >
                    Отзывы
                </button>
            </div>

            {activeTab === 'services' && (
                <div className="card">
                    <h3>Услуги</h3>

                    {services.length === 0 ? (
                        <p className="empty-text">Услуг пока нет.</p>
                    ) : (
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                                gap: '16px'
                            }}
                        >
                            {services.map((service) => (
                                <div
                                    key={service.service_id}
                                    className="card"
                                >
                                    <h4>{service.title}</h4>

                                    <p>{service.description}</p>

                                    <p>
                                        <strong>Цена:</strong> {service.price} ₽
                                    </p>

                                    <p>
                                        <strong>Срок:</strong> {service.deadline} дн.
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'portfolio' && (
                <div className="card">
                    <h3>Портфолио</h3>

                    {portfolio.length === 0 ? (
                        <p className="empty-text">Работ пока нет.</p>
                    ) : (
                        portfolio.map((item) => {
                            const embedUrl = getEmbedUrl(item.video_url);

                            return (
                                <div
                                    key={item.portfolio_id}
                                    className="card"
                                >
                                    <h4>{item.title}</h4>

                                    <p>{item.description}</p>

                                    {embedUrl ? (
                                        <iframe
                                            src={embedUrl}
                                            title={item.title}
                                            style={{
                                                width: '100%',
                                                maxWidth: '700px',
                                                height: getEmbedHeight(item.video_url),
                                                border: 'none',
                                                borderRadius: '12px',
                                                marginTop: '10px',
                                                background: '#000'
                                            }}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                            allowFullScreen
                                        />
                                    ) : isDirectVideo(item.video_url) ? (
                                        <video
                                            controls
                                            style={{
                                                width: '100%',
                                                maxWidth: '700px',
                                                borderRadius: '12px',
                                                marginTop: '10px',
                                                background: '#000'
                                            }}
                                        >
                                            <source src={item.video_url} />
                                            Ваш браузер не поддерживает видео.
                                        </video>
                                    ) : (
                                        <a
                                            href={item.video_url}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            Смотреть видео
                                        </a>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {activeTab === 'reviews' && (
                <div className="card">
                    <h3>Отзывы</h3>

                    <p>
                        <strong>
                            Средний рейтинг: ⭐ {averageRating} / 5
                        </strong>
                    </p>

                    {reviews.length === 0 ? (
                        <p className="empty-text">Отзывов пока нет.</p>
                    ) : (
                        reviews.map((review) => (
                            <div
                                key={review.review_id}
                                className="card"
                            >
                                <p>
                                    <strong>Клиент:</strong> {review.client_name}
                                </p>

                                <p>
                                    <strong>Оценка:</strong>{' '}
                                    ⭐ {Number(review.rating).toFixed(1)}
                                </p>

                                <div
                                    style={{
                                        display: 'flex',
                                        gap: '10px',
                                        flexWrap: 'wrap',
                                        marginBottom: '10px'
                                    }}
                                >
                                    <span className="status status-progress">
                                        Качество: {review.quality_rating}
                                    </span>

                                    <span className="status status-open">
                                        Сроки: {review.deadline_rating}
                                    </span>

                                    <span className="status status-completed">
                                        Коммуникация: {review.communication_rating}
                                    </span>
                                </div>

                                <p>
                                    <strong>Комментарий:</strong>{' '}
                                    {review.comment || 'Без комментария'}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

export default EditorPublicProfile;
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function Profile() {
    const savedUser = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);

    const [services, setServices] = useState([]);
    const [editingService, setEditingService] = useState(null);

    const [portfolio, setPortfolio] = useState([]);
    const [editingPortfolio, setEditingPortfolio] = useState(null);

    const [activeTab, setActiveTab] = useState('services');

    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const [form, setForm] = useState({
        full_name: savedUser?.full_name || '',
        city: savedUser?.city || '',
        avatar: savedUser?.avatar || '',
        bio: savedUser?.bio || ''
    });

    const [serviceForm, setServiceForm] = useState({
        title: '',
        description: '',
        price: '',
        deadline: ''
    });

    const [portfolioForm, setPortfolioForm] = useState({
        title: '',
        description: '',
        video_url: ''
    });

    const loadReviews = async () => {
        if (savedUser?.role !== 'EDITOR') return;

        try {
            const response = await api.get(
                `/reviews/editor/${savedUser.user_id}`
            );

            const data = response.data.reviews || [];
            setReviews(data);

            if (data.length > 0) {
                const avg =
                    data.reduce(
                        (sum, review) => sum + Number(review.rating || 0),
                        0
                    ) / data.length;

                setAverageRating(avg.toFixed(1));
            } else {
                setAverageRating(0);
            }

        } catch (error) {
            console.error(error);
        }
    };

    const loadServices = async () => {
        if (savedUser?.role !== 'EDITOR') return;

        try {
            const response = await api.get('/services');

            const myServices = (response.data.services || []).filter(
                (service) => Number(service.user_id) === Number(savedUser.user_id)
            );

            setServices(myServices);

        } catch (error) {
            console.error(error);
        }
    };

    const loadPortfolio = async () => {
        if (savedUser?.role !== 'EDITOR') return;

        try {
            const response = await api.get('/portfolio');

            const myPortfolio = (response.data.portfolio || []).filter(
                (item) => Number(item.user_id) === Number(savedUser.user_id)
            );

            setPortfolio(myPortfolio);

        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        loadReviews();
        loadServices();
        loadPortfolio();
    }, []);

    const getRoleInfo = (role) => {
        if (role === 'ADMIN') {
            return {
                text: 'Администратор',
                className: 'status status-completed'
            };
        }

        if (role === 'EDITOR') {
            return {
                text: 'Монтажёр',
                className: 'status status-progress'
            };
        }

        return {
            text: 'Заказчик',
            className: 'status status-open'
        };
    };

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const updateProfile = async (e) => {
        e.preventDefault();

        try {
            const response = await api.put('/users/profile', form, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            localStorage.setItem('user', JSON.stringify(response.data.user));

            setMessage('Профиль обновлён');
            setIsSuccess(true);

        } catch (error) {
            setMessage(error.response?.data?.message || 'Ошибка обновления профиля');
            setIsSuccess(false);
        }
    };

    const handleServiceChange = (e) => {
        setServiceForm({
            ...serviceForm,
            [e.target.name]: e.target.value
        });
    };

    const startEditService = (service) => {
        setEditingService(service.service_id);

        setServiceForm({
            title: service.title || '',
            description: service.description || '',
            price: service.price || '',
            deadline: service.deadline || ''
        });

        setActiveTab('services');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEditService = () => {
        setEditingService(null);

        setServiceForm({
            title: '',
            description: '',
            price: '',
            deadline: ''
        });
    };

    const createService = async (e) => {
        e.preventDefault();

        try {
            if (editingService) {
                await api.put(
                    `/services/${editingService}`,
                    serviceForm,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                setMessage('Услуга обновлена');
            } else {
                await api.post(
                    '/services',
                    serviceForm,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                setMessage('Услуга создана');
            }

            setIsSuccess(true);
            cancelEditService();
            loadServices();

        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                'Ошибка сохранения услуги'
            );
            setIsSuccess(false);
        }
    };

    const deleteService = async (service) => {
        const confirmed = window.confirm(
            `Удалить услугу "${service.title || 'Без названия'}"?`
        );

        if (!confirmed) return;

        try {
            await api.delete(`/services/${service.service_id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setMessage('Услуга удалена');
            setIsSuccess(true);

            loadServices();

        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                'Ошибка удаления услуги'
            );
            setIsSuccess(false);
        }
    };

    const handlePortfolioChange = (e) => {
        setPortfolioForm({
            ...portfolioForm,
            [e.target.name]: e.target.value
        });
    };

    const startEditPortfolio = (item) => {
        setEditingPortfolio(item.portfolio_id);

        setPortfolioForm({
            title: item.title || '',
            description: item.description || '',
            video_url: item.video_url || ''
        });

        setActiveTab('portfolio');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEditPortfolio = () => {
        setEditingPortfolio(null);

        setPortfolioForm({
            title: '',
            description: '',
            video_url: ''
        });
    };

    const createPortfolioItem = async (e) => {
        e.preventDefault();

        try {
            if (editingPortfolio) {
                await api.put(
                    `/portfolio/${editingPortfolio}`,
                    portfolioForm,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                setMessage('Работа обновлена');
            } else {
                await api.post(
                    '/portfolio',
                    portfolioForm,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                setMessage('Работа добавлена');
            }

            setIsSuccess(true);
            cancelEditPortfolio();
            loadPortfolio();

        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                'Ошибка сохранения работы'
            );
            setIsSuccess(false);
        }
    };

    const deletePortfolioItem = async (item) => {
        const confirmed = window.confirm(
            `Удалить работу "${item.title || 'Без названия'}" из портфолио?`
        );

        if (!confirmed) return;

        try {
            await api.delete(`/portfolio/${item.portfolio_id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setMessage('Работа удалена');
            setIsSuccess(true);

            loadPortfolio();

        } catch (error) {
            setMessage(error.response?.data?.message || 'Ошибка удаления работы');
            setIsSuccess(false);
        }
    };

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

    const roleInfo = getRoleInfo(savedUser?.role);

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
                    {form.avatar ? (
                        <img
                            src={form.avatar}
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
                                color: '#9ca3af',
                                textAlign: 'center'
                            }}
                        >
                            Нет фото
                        </div>
                    )}
                </div>

                <div style={{ flex: 1, minWidth: '260px' }}>
                    <h2 style={{ marginTop: 0 }}>
                        {form.full_name || savedUser?.email || 'Мой профиль'}
                    </h2>

                    <div
                        style={{
                            display: 'flex',
                            gap: '10px',
                            flexWrap: 'wrap',
                            marginBottom: '15px'
                        }}
                    >
                        <span className={roleInfo.className}>
                            {roleInfo.text}
                        </span>

                        {savedUser?.role === 'EDITOR' && (
                            <>
                                <span className="status status-progress">
                                    ⭐ {averageRating} / 5
                                </span>

                                <span className="status status-open">
                                    Услуг: {services.length}
                                </span>

                                <span className="status status-completed">
                                    Работ: {portfolio.length}
                                </span>

                                <span className="status status-progress">
                                    Отзывов: {reviews.length}
                                </span>
                            </>
                        )}
                    </div>

                    <p>
                        <strong>Email:</strong> {savedUser?.email}
                    </p>

                    <p>
                        <strong>Город:</strong> {form.city || 'Не указан'}
                    </p>

                    {form.bio ? (
                        <div style={{ marginTop: '15px' }}>
                            <strong>О себе:</strong>
                            <p>{form.bio}</p>
                        </div>
                    ) : (
                        <p className="empty-text">
                            Описание профиля пока не заполнено.
                        </p>
                    )}

                    {savedUser?.role === 'EDITOR' && (
                        <Link to={`/editors/${savedUser.user_id}`}>
                            <button style={{ marginTop: '10px' }}>
                                Открыть публичный профиль
                            </button>
                        </Link>
                    )}
                </div>
            </div>

            {message && (
                <div className="card">
                    <strong style={{ color: isSuccess ? '#86efac' : '#fca5a5' }}>
                        {message}
                    </strong>
                </div>
            )}

            <div className="card">
                <h3 style={{ marginTop: 0 }}>
                    Редактирование профиля
                </h3>

                <form
                    onSubmit={updateProfile}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        maxWidth: '760px',
                        margin: 0
                    }}
                >
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                            gap: '12px'
                        }}
                    >
                        <label>
                            <strong>ФИО</strong>

                            <input
                                name="full_name"
                                placeholder="ФИО"
                                value={form.full_name}
                                onChange={handleChange}
                                style={{ width: '100%', marginTop: '6px' }}
                            />
                        </label>

                        <label>
                            <strong>Город</strong>

                            <input
                                name="city"
                                placeholder="Город"
                                value={form.city}
                                onChange={handleChange}
                                style={{ width: '100%', marginTop: '6px' }}
                            />
                        </label>
                    </div>

                    <label>
                        <strong>Ссылка на аватар</strong>

                        <input
                            name="avatar"
                            placeholder="https://..."
                            value={form.avatar}
                            onChange={handleChange}
                            style={{ width: '100%', marginTop: '6px' }}
                        />
                    </label>

                    <label>
                        <strong>Описание профиля</strong>

                        <textarea
                            name="bio"
                            placeholder="Расскажите о себе"
                            value={form.bio}
                            onChange={handleChange}
                            rows="4"
                            style={{ width: '100%', marginTop: '6px' }}
                        />
                    </label>

                    <button type="submit">
                        Сохранить профиль
                    </button>
                </form>
            </div>

            {savedUser?.role === 'EDITOR' && (
                <>
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
                            Мои услуги
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
                            <h3 style={{ marginTop: 0 }}>Мои услуги</h3>

                            <form
                                onSubmit={createService}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px',
                                    maxWidth: '760px',
                                    margin: 0
                                }}
                            >
                                <h4>
                                    {editingService
                                        ? 'Редактирование услуги'
                                        : 'Добавить услугу'}
                                </h4>

                                <input
                                    name="title"
                                    placeholder="Название услуги"
                                    value={serviceForm.title}
                                    onChange={handleServiceChange}
                                    required
                                />

                                <textarea
                                    name="description"
                                    placeholder="Описание"
                                    value={serviceForm.description}
                                    onChange={handleServiceChange}
                                    rows="3"
                                    required
                                />

                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                                        gap: '12px'
                                    }}
                                >
                                    <input
                                        name="price"
                                        type="number"
                                        min="1"
                                        placeholder="Цена"
                                        value={serviceForm.price}
                                        onChange={handleServiceChange}
                                        required
                                    />

                                    <input
                                        name="deadline"
                                        type="number"
                                        min="1"
                                        placeholder="Срок в днях"
                                        value={serviceForm.deadline}
                                        onChange={handleServiceChange}
                                        required
                                    />
                                </div>

                                <div>
                                    <button type="submit">
                                        {editingService
                                            ? 'Сохранить изменения'
                                            : 'Добавить услугу'}
                                    </button>

                                    {editingService && (
                                        <button
                                            type="button"
                                            onClick={cancelEditService}
                                            style={{
                                                marginLeft: '10px',
                                                background: '#374151'
                                            }}
                                        >
                                            Отмена
                                        </button>
                                    )}
                                </div>
                            </form>

                            <hr />

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
                                            <h4 style={{ marginTop: 0 }}>
                                                {service.title}
                                            </h4>

                                            <p>{service.description}</p>

                                            <div
                                                style={{
                                                    display: 'flex',
                                                    gap: '10px',
                                                    flexWrap: 'wrap',
                                                    marginBottom: '12px'
                                                }}
                                            >
                                                <span className="status status-progress">
                                                    {service.price} ₽
                                                </span>

                                                <span className="status status-completed">
                                                    {service.deadline} дн.
                                                </span>
                                            </div>

                                            <button
                                                onClick={() => startEditService(service)}
                                            >
                                                Редактировать
                                            </button>

                                            <button
                                                onClick={() => deleteService(service)}
                                                style={{ marginLeft: '10px' }}
                                            >
                                                Удалить
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'portfolio' && (
                        <div className="card">
                            <h3 style={{ marginTop: 0 }}>Моё портфолио</h3>

                            <form
                                onSubmit={createPortfolioItem}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px',
                                    maxWidth: '760px',
                                    margin: 0
                                }}
                            >
                                <h4>
                                    {editingPortfolio
                                        ? 'Редактирование работы'
                                        : 'Добавить работу'}
                                </h4>

                                <input
                                    name="title"
                                    placeholder="Название работы"
                                    value={portfolioForm.title}
                                    onChange={handlePortfolioChange}
                                    required
                                />

                                <textarea
                                    name="description"
                                    placeholder="Описание"
                                    value={portfolioForm.description}
                                    onChange={handlePortfolioChange}
                                    rows="3"
                                    required
                                />

                                <input
                                    name="video_url"
                                    placeholder="Ссылка на видео"
                                    value={portfolioForm.video_url}
                                    onChange={handlePortfolioChange}
                                    required
                                />

                                <div>
                                    <button type="submit">
                                        {editingPortfolio
                                            ? 'Сохранить изменения'
                                            : 'Добавить работу'}
                                    </button>

                                    {editingPortfolio && (
                                        <button
                                            type="button"
                                            onClick={cancelEditPortfolio}
                                            style={{
                                                marginLeft: '10px',
                                                background: '#374151'
                                            }}
                                        >
                                            Отмена
                                        </button>
                                    )}
                                </div>
                            </form>

                            <hr />

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
                                            <h4 style={{ marginTop: 0 }}>
                                                {item.title}
                                            </h4>

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

                                            <div style={{ marginTop: '12px' }}>
                                                <button
                                                    onClick={() => startEditPortfolio(item)}
                                                >
                                                    Редактировать
                                                </button>

                                                <button
                                                    onClick={() => deletePortfolioItem(item)}
                                                    style={{ marginLeft: '10px' }}
                                                >
                                                    Удалить
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {activeTab === 'reviews' && (
                        <div className="card">
                            <h3 style={{ marginTop: 0 }}>Мои отзывы</h3>

                            <div
                                style={{
                                    display: 'flex',
                                    gap: '10px',
                                    flexWrap: 'wrap',
                                    marginBottom: '15px'
                                }}
                            >
                                <span className="status status-progress">
                                    Средний рейтинг: ⭐ {averageRating} / 5
                                </span>

                                <span className="status status-open">
                                    Отзывов: {reviews.length}
                                </span>
                            </div>

                            {reviews.length === 0 ? (
                                <p className="empty-text">Отзывов пока нет.</p>
                            ) : (
                                reviews.map((review) => (
                                    <div
                                        key={review.review_id}
                                        className="card"
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                gap: '12px',
                                                flexWrap: 'wrap'
                                            }}
                                        >
                                            <h4 style={{ marginTop: 0 }}>
                                                {review.client_name || 'Клиент'}
                                            </h4>

                                            <span className="status status-progress">
                                                ⭐ {Number(review.rating || 0).toFixed(1)}
                                            </span>
                                        </div>

                                        <div
                                            style={{
                                                display: 'flex',
                                                gap: '10px',
                                                flexWrap: 'wrap',
                                                marginBottom: '12px'
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
                </>
            )}
        </div>
    );
}

export default Profile;
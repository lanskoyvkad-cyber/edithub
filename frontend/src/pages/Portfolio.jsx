import { useEffect, useState } from 'react';
import api from '../services/api';

function Portfolio() {
    const [portfolio, setPortfolio] = useState([]);
    const [editingItem, setEditingItem] = useState(null);

    const [form, setForm] = useState({
        title: '',
        description: '',
        video_url: ''
    });

    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

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

    const loadPortfolio = async () => {
        try {
            const response = await api.get('/portfolio');
            setPortfolio(response.data.portfolio || []);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        loadPortfolio();
    }, []);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const createPortfolioItem = async (e) => {
        e.preventDefault();

        try {
            if (editingItem) {
                await api.put(
                    `/portfolio/${editingItem}`,
                    form,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                alert('Работа обновлена');
                setEditingItem(null);

            } else {
                await api.post(
                    '/portfolio',
                    form,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                alert('Работа добавлена');
            }

            setForm({
                title: '',
                description: '',
                video_url: ''
            });

            loadPortfolio();

        } catch (error) {
            alert(error.response?.data?.message || 'Ошибка сохранения работы');
        }
    };

    const startEdit = (item) => {
        setEditingItem(item.portfolio_id);

        setForm({
            title: item.title || '',
            description: item.description || '',
            video_url: item.video_url || ''
        });
    };

    const cancelEdit = () => {
        setEditingItem(null);

        setForm({
            title: '',
            description: '',
            video_url: ''
        });
    };

    const deletePortfolioItem = async (id) => {
        const confirmed = window.confirm('Удалить работу из портфолио?');

        if (!confirmed) return;

        try {
            await api.delete(`/portfolio/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            alert('Работа удалена');
            loadPortfolio();

        } catch (error) {
            alert(error.response?.data?.message || 'Ошибка удаления работы');
        }
    };

    return (
        <div className="page">
            <h2>Портфолио монтажёров</h2>

            {user?.role === 'EDITOR' && (
                <form
                    onSubmit={createPortfolioItem}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        maxWidth: '650px'
                    }}
                >
                    <h3>
                        {editingItem
                            ? 'Редактировать работу'
                            : 'Добавить работу'}
                    </h3>

                    <input
                        name="title"
                        placeholder="Название работы"
                        value={form.title}
                        onChange={handleChange}
                    />

                    <textarea
                        name="description"
                        placeholder="Описание"
                        value={form.description}
                        onChange={handleChange}
                        rows="3"
                    />

                    <input
                        name="video_url"
                        placeholder="Ссылка на видео"
                        value={form.video_url}
                        onChange={handleChange}
                    />

                    <div>
                        <button type="submit">
                            {editingItem
                                ? 'Сохранить изменения'
                                : 'Добавить'}
                        </button>

                        {editingItem && (
                            <button
                                type="button"
                                onClick={cancelEdit}
                                style={{ marginLeft: '10px' }}
                            >
                                Отмена
                            </button>
                        )}
                    </div>
                </form>
            )}

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
                            <h3>{item.title}</h3>

                            <p>{item.description}</p>

                            <p>
                                <strong>Монтажёр:</strong> {item.editor_name}
                            </p>

                            <p>
                                <strong>Город:</strong> {item.editor_city}
                            </p>

                            {embedUrl ? (
                                <iframe
                                    src={embedUrl}
                                    title={item.title}
                                    style={{
                                        width: '100%',
                                        maxWidth: '600px',
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
                                        maxWidth: '600px',
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

                            {Number(user?.user_id) === Number(item.user_id) && (
                                <div style={{ marginTop: '10px' }}>
                                    <button
                                        onClick={() => startEdit(item)}
                                    >
                                        Редактировать
                                    </button>

                                    <button
                                        onClick={() => deletePortfolioItem(item.portfolio_id)}
                                        style={{ marginLeft: '10px' }}
                                    >
                                        Удалить
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
}

export default Portfolio;
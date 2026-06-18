import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function Orders() {
    const [orders, setOrders] = useState([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [sort, setSort] = useState('newest');

    const [applyingOrderId, setApplyingOrderId] = useState(null);
    const [applicationMessage, setApplicationMessage] = useState('');
    const [message, setMessage] = useState('');

    const savedUser = localStorage.getItem('user');
    const user = savedUser ? JSON.parse(savedUser) : null;

    const statusLabels = {
        OPEN: 'Открыт',
        IN_PROGRESS: 'В работе',
        COMPLETED: 'Завершён',
        CANCELLED: 'Отменён'
    };

    const statusClassNames = {
        OPEN: 'status status-open',
        IN_PROGRESS: 'status status-progress',
        COMPLETED: 'status status-completed',
        CANCELLED: 'status status-cancelled'
    };

    const loadOrders = async () => {
        try {
            const response = await api.get('/orders');
            setOrders(response.data.orders || []);
        } catch (error) {
            console.error(error);
            setMessage('Ошибка загрузки заказов');
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    const formatDate = (date) => {
        if (!date) return 'Не указана';

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return 'Не указана';
        }

        return parsedDate.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatDeadline = (deadline) => {
        if (!deadline) return 'Не указан';

        const value = String(deadline);

        if (/^\d+$/.test(value)) {
            return `${value} дн.`;
        }

        const parsedDate = new Date(deadline);

        if (Number.isNaN(parsedDate.getTime())) {
            return value;
        }

        return parsedDate.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const startApply = (orderId) => {
        setMessage('');
        setApplyingOrderId(orderId);
        setApplicationMessage('');
    };

    const cancelApply = () => {
        setApplyingOrderId(null);
        setApplicationMessage('');
    };

    const applyToOrder = async (orderId) => {
        const token = localStorage.getItem('token');

        if (!applicationMessage.trim()) {
            setMessage('Введите сообщение для заказчика');
            return;
        }

        try {
            await api.post(
                '/applications',
                {
                    order_id: orderId,
                    message: applicationMessage
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setMessage('Отклик успешно отправлен');
            setApplyingOrderId(null);
            setApplicationMessage('');

        } catch (error) {
            setMessage(error.response?.data?.message || 'Ошибка при отправке отклика');
        }
    };

    const filteredOrders = orders
        .filter((order) => {
            const text = `
                ${order.order_id || ''}
                ${order.title || ''}
                ${order.description || ''}
                ${order.video_type || ''}
                ${order.client_name || ''}
                ${order.user_name || ''}
            `.toLowerCase();

            const matchesSearch = text.includes(search.toLowerCase());

            const matchesStatus =
                statusFilter === 'ALL' || order.status === statusFilter;

            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            if (sort === 'newest') {
                return new Date(b.created_at) - new Date(a.created_at);
            }

            if (sort === 'oldest') {
                return new Date(a.created_at) - new Date(b.created_at);
            }

            if (sort === 'budget_high') {
                return Number(b.budget || 0) - Number(a.budget || 0);
            }

            if (sort === 'budget_low') {
                return Number(a.budget || 0) - Number(b.budget || 0);
            }

            return 0;
        });

    return (
        <div className="page">
            <div className="card">
                <h2 style={{ marginTop: 0 }}>Биржа заказов</h2>

                <p className="empty-text">
                    Здесь опубликованы заказы на видеомонтаж. Монтажёры могут
                    откликаться на открытые заказы, а заказчики — просматривать
                    свои публикации и отклики.
                </p>
            </div>

            {message && (
                <div className="card">
                    <strong>{message}</strong>
                </div>
            )}

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
                    placeholder="Поиск по названию, описанию, типу видео или заказчику"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        flex: 1,
                        minWidth: '280px'
                    }}
                />

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="ALL">Все статусы</option>
                    <option value="OPEN">Открытые</option>
                    <option value="IN_PROGRESS">В работе</option>
                    <option value="COMPLETED">Завершённые</option>
                    <option value="CANCELLED">Отменённые</option>
                </select>

                <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                >
                    <option value="newest">Сначала новые</option>
                    <option value="oldest">Сначала старые</option>
                    <option value="budget_high">Бюджет по убыванию</option>
                    <option value="budget_low">Бюджет по возрастанию</option>
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
                    Всего: {orders.length}
                </span>

                <span className="status status-open">
                    Открытых: {orders.filter((order) => order.status === 'OPEN').length}
                </span>

                <span className="status status-progress">
                    В работе: {orders.filter((order) => order.status === 'IN_PROGRESS').length}
                </span>

                <span className="status status-completed">
                    Завершённых: {orders.filter((order) => order.status === 'COMPLETED').length}
                </span>
            </div>

            {filteredOrders.length === 0 ? (
                <div className="card">
                    <p className="empty-text">Заказы не найдены.</p>
                </div>
            ) : (
                filteredOrders.map((order) => {
                    const isOwnClientOrder =
                        user?.role === 'CLIENT' &&
                        Number(order.user_id) === Number(user.user_id);

                    const canApply =
                        user?.role === 'EDITOR' &&
                        order.status === 'OPEN';

                    return (
                        <div
                            key={order.order_id}
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
                                        {order.title || 'Заказ без названия'}
                                    </h3>

                                    <p className="empty-text">
                                        ID заказа: {order.order_id}
                                    </p>

                                    <p>
                                        {order.description || 'Описание не указано'}
                                    </p>
                                </div>

                                <span className={statusClassNames[order.status] || 'status'}>
                                    {statusLabels[order.status] || order.status}
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
                                    Бюджет: {order.budget || 0} ₽
                                </span>

                                <span className="status status-completed">
                                    Срок: {formatDeadline(order.deadline)}
                                </span>

                                <span className="status status-open">
                                    Тип видео: {order.video_type || 'Не указан'}
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
                                <p>
                                    <strong>Заказчик:</strong>{' '}
                                    {order.client_name || order.user_name || 'Не указан'}
                                </p>

                                <p style={{ marginBottom: 0 }}>
                                    <strong>Создан:</strong>{' '}
                                    {formatDate(order.created_at)}
                                </p>
                            </div>

                            {applyingOrderId === order.order_id && (
                                <div
                                    style={{
                                        background: '#0f172a',
                                        border: '1px solid #374151',
                                        borderRadius: '12px',
                                        padding: '14px',
                                        marginTop: '15px'
                                    }}
                                >
                                    <h4 style={{ marginTop: 0 }}>
                                        Отклик на заказ
                                    </h4>

                                    <textarea
                                        placeholder="Напишите сообщение для заказчика"
                                        value={applicationMessage}
                                        onChange={(e) => setApplicationMessage(e.target.value)}
                                        rows="4"
                                        style={{
                                            width: '100%',
                                            margin: 0
                                        }}
                                    />

                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: '10px',
                                            flexWrap: 'wrap',
                                            marginTop: '10px'
                                        }}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => applyToOrder(order.order_id)}
                                        >
                                            Отправить отклик
                                        </button>

                                        <button
                                            type="button"
                                            onClick={cancelApply}
                                            style={{ background: '#374151' }}
                                        >
                                            Отмена
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div
                                style={{
                                    display: 'flex',
                                    gap: '10px',
                                    flexWrap: 'wrap',
                                    marginTop: '15px'
                                }}
                            >
                                <Link to={`/orders/${order.order_id}`}>
                                    <button>
                                        Открыть заказ
                                    </button>
                                </Link>

                                {isOwnClientOrder && (
                                    <Link to={`/orders/${order.order_id}/applications`}>
                                        <button>
                                            Посмотреть отклики
                                        </button>
                                    </Link>
                                )}

                                {canApply && applyingOrderId !== order.order_id && (
                                    <button onClick={() => startApply(order.order_id)}>
                                        Откликнуться
                                    </button>
                                )}
                            </div>

                            {user?.role === 'EDITOR' && order.status !== 'OPEN' && (
                                <p className="empty-text" style={{ marginTop: '12px' }}>
                                    На этот заказ уже нельзя откликнуться.
                                </p>
                            )}

                            {!user && (
                                <p className="empty-text" style={{ marginTop: '12px' }}>
                                    Чтобы откликнуться на заказ, войдите как монтажёр.
                                </p>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
}

export default Orders;
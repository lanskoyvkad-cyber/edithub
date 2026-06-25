import { useEffect, useState } from 'react';
import api from '../services/api';

function AdminComplaints() {
    const token = localStorage.getItem('token');

    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadComplaints = async () => {
        try {
            const response = await api.get('/complaints', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setComplaints(response.data.complaints || []);
        } catch (error) {
            console.error(error);
            alert(
                error.response?.data?.message ||
                'Ошибка загрузки жалоб'
            );
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (complaintId, status) => {
        const adminComment = prompt('Комментарий администратора:', '');

        try {
            await api.patch(
                `/complaints/${complaintId}/status`,
                {
                    status,
                    admin_comment: adminComment || ''
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            loadComplaints();
        } catch (error) {
            console.error(error);
            alert(
                error.response?.data?.message ||
                'Ошибка обновления статуса жалобы'
            );
        }
    };

    const deleteComplaint = async (complaintId) => {
        const confirmed = window.confirm('Удалить жалобу?');

        if (!confirmed) return;

        try {
            await api.delete(`/complaints/${complaintId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            loadComplaints();
        } catch (error) {
            console.error(error);
            alert(
                error.response?.data?.message ||
                'Ошибка удаления жалобы'
            );
        }
    };

    const blockUserFromComplaint = async (complaintId) => {
        const confirmed = window.confirm(
            'Заблокировать пользователя по этой жалобе?'
        );

        if (!confirmed) return;

        try {
            await api.patch(
                `/complaints/${complaintId}/block-user`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            alert('Пользователь заблокирован');

            loadComplaints();
        } catch (error) {
            console.error(error);
            alert(
                error.response?.data?.message ||
                'Ошибка блокировки пользователя'
            );
        }
    };

    const unblockUserFromComplaint = async (complaintId) => {
        const confirmed = window.confirm(
            'Разблокировать пользователя по этой жалобе?'
        );

        if (!confirmed) return;

        try {
            await api.patch(
                `/complaints/${complaintId}/unblock-user`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            alert('Пользователь разблокирован');

            loadComplaints();
        } catch (error) {
            console.error(error);
            alert(
                error.response?.data?.message ||
                'Ошибка разблокировки пользователя'
            );
        }
    };

    const getStatusText = (status) => {
        if (status === 'NEW') return 'Новая';
        if (status === 'IN_PROGRESS') return 'В работе';
        if (status === 'RESOLVED') return 'Решена';
        if (status === 'REJECTED') return 'Отклонена';
        return status;
    };

    const getTargetText = (targetType) => {
        if (targetType === 'USER') return 'Пользователь';
        if (targetType === 'ORDER') return 'Заказ';
        if (targetType === 'REVIEW') return 'Отзыв';
        if (targetType === 'MESSAGE') return 'Сообщение';
        return targetType;
    };

    const getStatusClass = (status) => {
        if (status === 'NEW') return 'status status-open';
        if (status === 'IN_PROGRESS') return 'status status-progress';
        if (status === 'RESOLVED') return 'status status-completed';
        if (status === 'REJECTED') return 'status status-cancelled';
        return 'status';
    };

    useEffect(() => {
        loadComplaints();
    }, []);

    if (loading) {
        return (
            <div className="page">
                <div className="card">
                    <h2>Загрузка жалоб...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <h2>Жалобы пользователей</h2>

            {complaints.length === 0 ? (
                <div className="card">
                    <p className="empty-text">Жалоб пока нет.</p>
                </div>
            ) : (
                complaints.map((complaint) => (
                    <div key={complaint.complaint_id} className="card">
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                gap: '12px',
                                flexWrap: 'wrap',
                                alignItems: 'center'
                            }}
                        >
                            <h3 style={{ marginTop: 0 }}>
                                Жалоба №{complaint.complaint_id}
                            </h3>

                            <span className={getStatusClass(complaint.status)}>
                                {getStatusText(complaint.status)}
                            </span>
                        </div>

                        <p>
                            <strong>Отправитель:</strong>{' '}
                            {complaint.reporter_name || 'Не указан'} ({complaint.reporter_email})
                        </p>

                        <p>
                            <strong>Объект жалобы:</strong>{' '}
                            {getTargetText(complaint.target_type)} #{complaint.target_id}
                        </p>

                        {complaint.target_type === 'USER' && (
                            <div
                                style={{
                                    marginTop: '10px',
                                    padding: '12px',
                                    borderRadius: '10px',
                                    background: '#111827',
                                    border: '1px solid #374151'
                                }}
                            >
                                <p style={{ marginTop: 0 }}>
                                    <strong>Пользователь, на которого пожаловались:</strong>
                                </p>

                                <p>
                                    <strong>Имя:</strong>{' '}
                                    {complaint.target_user_name || 'Не указано'}
                                </p>

                                <p style={{ marginBottom: 0 }}>
                                    <strong>Email:</strong>{' '}
                                    {complaint.target_user_email || 'Не указан'}
                                </p>
                            </div>
                        )}

                        {complaint.target_type === 'MESSAGE' && (
                            <div
                                style={{
                                    marginTop: '10px',
                                    padding: '12px',
                                    borderRadius: '10px',
                                    background: '#111827',
                                    border: '1px solid #374151'
                                }}
                            >
                                <p style={{ marginTop: 0 }}>
                                    <strong>Сообщение, на которое пожаловались:</strong>
                                </p>

                                <p>
                                    <strong>Отправитель:</strong>{' '}
                                    {complaint.target_message_sender_name || 'Не указан'}
                                    {complaint.target_message_sender_email
                                        ? ` (${complaint.target_message_sender_email})`
                                        : ''}
                                </p>

                                <p>
                                    <strong>Текст сообщения:</strong>{' '}
                                    {complaint.target_message_text || 'Без текста'}
                                </p>

                                {complaint.target_message_file_name && (
                                    <p>
                                        <strong>Файл:</strong>{' '}
                                        {complaint.target_message_file_name}
                                    </p>
                                )}

                                <p>
                                    <strong>Чат:</strong>{' '}
                                    #{complaint.target_message_chat_id || 'не указан'}
                                </p>

                                {complaint.target_message_created_at && (
                                    <p style={{ marginBottom: 0 }}>
                                        <strong>Дата сообщения:</strong>{' '}
                                        {new Date(complaint.target_message_created_at).toLocaleString('ru-RU')}
                                    </p>
                                )}
                            </div>
                        )}

                        <p>
                            <strong>Причина:</strong> {complaint.reason}
                        </p>

                        <p>
                            <strong>Описание:</strong>{' '}
                            {complaint.description || 'Без описания'}
                        </p>

                        {complaint.admin_comment && (
                            <p>
                                <strong>Комментарий администратора:</strong>{' '}
                                {complaint.admin_comment}
                            </p>
                        )}

                        <p className="empty-text">
                            Создана: {new Date(complaint.created_at).toLocaleString('ru-RU')}
                        </p>

                        <div
                            style={{
                                display: 'flex',
                                gap: '10px',
                                flexWrap: 'wrap',
                                marginTop: '12px'
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => updateStatus(complaint.complaint_id, 'IN_PROGRESS')}
                            >
                                В работу
                            </button>

                            <button
                                type="button"
                                onClick={() => updateStatus(complaint.complaint_id, 'RESOLVED')}
                            >
                                Решена
                            </button>

                            <button
                                type="button"
                                onClick={() => updateStatus(complaint.complaint_id, 'REJECTED')}
                                style={{ background: '#b45309' }}
                            >
                                Отклонить
                            </button>

                            {complaint.target_type === 'USER' && !complaint.target_user_is_blocked && (
                                <button
                                    type="button"
                                    onClick={() => blockUserFromComplaint(complaint.complaint_id)}
                                    style={{ background: '#991b1b' }}
                                >
                                    Заблокировать пользователя
                                </button>
                            )}

                            {complaint.target_type === 'USER' && complaint.target_user_is_blocked && (
                                <button
                                    type="button"
                                    onClick={() => unblockUserFromComplaint(complaint.complaint_id)}
                                    style={{ background: '#047857' }}
                                >
                                    Разблокировать пользователя
                                </button>
                            )}

                            {complaint.target_type === 'MESSAGE' && !complaint.target_message_sender_is_blocked && (
                                <button
                                    type="button"
                                    onClick={() => blockUserFromComplaint(complaint.complaint_id)}
                                    style={{ background: '#991b1b' }}
                                >
                                    Заблокировать отправителя
                                </button>
                            )}

                            {complaint.target_type === 'MESSAGE' && complaint.target_message_sender_is_blocked && (
                                <button
                                    type="button"
                                    onClick={() => unblockUserFromComplaint(complaint.complaint_id)}
                                    style={{ background: '#047857' }}
                                >
                                    Разблокировать отправителя
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => deleteComplaint(complaint.complaint_id)}
                                style={{ background: '#dc2626' }}
                            >
                                Удалить
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

export default AdminComplaints;
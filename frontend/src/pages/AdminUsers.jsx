import { useEffect, useState } from 'react';
import api from '../services/api';

function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');

    const token = localStorage.getItem('token');
    const currentUser = JSON.parse(localStorage.getItem('user'));

    const loadUsers = async () => {
        try {
            const response = await api.get('/users', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setUsers(response.data.users || []);
        } catch (error) {
            alert(error.response?.data?.message || 'Ошибка загрузки пользователей');
        }
    };

    useEffect(() => {
        loadUsers();
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

    const changeRole = async (userId, role) => {
        try {
            await api.patch(
                `/users/${userId}/role`,
                { role },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            alert('Роль обновлена');
            loadUsers();

        } catch (error) {
            alert(error.response?.data?.message || 'Ошибка изменения роли');
        }
    };

    const deleteUser = async (user) => {
        const confirmed = window.confirm(
            `Удалить пользователя "${user.full_name || user.email}"?`
        );

        if (!confirmed) return;

        try {
            await api.delete(`/users/${user.user_id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            alert('Пользователь удалён');
            loadUsers();

        } catch (error) {
            alert(error.response?.data?.message || 'Ошибка удаления пользователя');
        }
    };

    const filteredUsers = users.filter((user) => {
        const text = `
            ${user.user_id || ''}
            ${user.email || ''}
            ${user.full_name || ''}
            ${user.city || ''}
            ${user.role || ''}
        `.toLowerCase();

        const matchesSearch = text.includes(search.toLowerCase());
        const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;

        return matchesSearch && matchesRole;
    });

    return (
        <div className="page">
            <h2>Управление пользователями</h2>

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
                    placeholder="Поиск по имени, email, городу или роли"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        flex: 1,
                        minWidth: '260px'
                    }}
                />

                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                >
                    <option value="ALL">Все роли</option>
                    <option value="CLIENT">Заказчики</option>
                    <option value="EDITOR">Монтажёры</option>
                    <option value="ADMIN">Администраторы</option>
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
                    Всего: {users.length}
                </span>

                <span className="status status-open">
                    Заказчиков: {users.filter((user) => user.role === 'CLIENT').length}
                </span>

                <span className="status status-progress">
                    Монтажёров: {users.filter((user) => user.role === 'EDITOR').length}
                </span>

                <span className="status status-completed">
                    Администраторов: {users.filter((user) => user.role === 'ADMIN').length}
                </span>
            </div>

            {filteredUsers.length === 0 ? (
                <div className="card">
                    <p className="empty-text">Пользователи не найдены.</p>
                </div>
            ) : (
                filteredUsers.map((user) => {
                    const roleInfo = getRoleInfo(user.role);
                    const isCurrentUser =
                        Number(currentUser?.user_id) === Number(user.user_id);

                    return (
                        <div
                            key={user.user_id}
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
                                        {user.full_name || 'Без имени'}
                                    </h3>

                                    <p>
                                        <strong>ID:</strong> {user.user_id}
                                    </p>

                                    <p>
                                        <strong>Email:</strong> {user.email || 'Не указан'}
                                    </p>

                                    <p>
                                        <strong>Город:</strong> {user.city || 'Не указан'}
                                    </p>
                                </div>

                                <span className={roleInfo.className}>
                                    {roleInfo.text}
                                </span>
                            </div>

                            <div
                                style={{
                                    display: 'flex',
                                    gap: '10px',
                                    flexWrap: 'wrap',
                                    alignItems: 'center',
                                    marginTop: '15px'
                                }}
                            >
                                {user.role === 'ADMIN' ? (
                                    <p className="empty-text" style={{ margin: 0 }}>
                                        Роль администратора нельзя изменить здесь.
                                    </p>
                                ) : (
                                    <>
                                        <select
                                            value={user.role}
                                            onChange={(e) =>
                                                changeRole(user.user_id, e.target.value)
                                            }
                                        >
                                            <option value="CLIENT">CLIENT</option>
                                            <option value="EDITOR">EDITOR</option>
                                        </select>

                                        <button
                                            onClick={() => deleteUser(user)}
                                        >
                                            Удалить пользователя
                                        </button>
                                    </>
                                )}

                                {isCurrentUser && (
                                    <span className="status status-completed">
                                        Это вы
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}

export default AdminUsers;
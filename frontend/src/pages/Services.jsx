import { useEffect, useState } from 'react';
import api from '../services/api';

function Services() {
    const [services, setServices] = useState([]);
    const [editingService, setEditingService] = useState(null);
    const [form, setForm] = useState({
        title: '',
        description: '',
        price: '',
        deadline: ''
    });

    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    const loadServices = async () => {
        try {
            const response = await api.get('/services');
            setServices(response.data.services);
        } catch (error) {
            console.error(error);
        }
    };

    const deleteService = async (id) => {
        try {
            await api.delete(`/services/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            alert('Услуга удалена');
            loadServices();

        } catch (error) {
            alert(error.response?.data?.message || 'Ошибка удаления услуги');
        }
    };

    const startEdit = (service) => {
        setEditingService(service.service_id);

        setForm({
            title: service.title,
            description: service.description,
            price: service.price,
            deadline: service.deadline
        });
    };

    useEffect(() => {
        loadServices();
    }, []);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const createService = async (e) => {
        e.preventDefault();

        try {
            if (editingService) {
                await api.put(`/services/${editingService}`, form, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                alert('Услуга обновлена');
                setEditingService(null);

            } else {
                await api.post('/services', form, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                alert('Услуга создана');
            }

            setForm({
                title: '',
                description: '',
                price: '',
                deadline: ''
            });

            loadServices();

        } catch (error) {
            alert(error.response?.data?.message || 'Ошибка сохранения услуги');
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>Услуги монтажёров</h2>

            {user?.role === 'EDITOR' && (
                <form onSubmit={createService}>
                    <h3>Создать услугу</h3>

                    <input
                        name="title"
                        placeholder="Название услуги"
                        value={form.title}
                        onChange={handleChange}
                    />

                    <textarea
                        name="description"
                        placeholder="Описание"
                        value={form.description}
                        onChange={handleChange}
                    />

                    <input
                        name="price"
                        type="number"
                        placeholder="Цена"
                        value={form.price}
                        onChange={handleChange}
                    />

                    <input
                        name="deadline"
                        type="number"
                        placeholder="Срок в днях"
                        value={form.deadline}
                        onChange={handleChange}
                    />

                    <button type="submit">
                        {editingService ? 'Сохранить изменения' : 'Создать услугу'}
                    </button>
                </form>
            )}

            <hr />

            {services.map((service) => (
                <div
                    key={service.service_id}
                    style={{
                        border: '1px solid #444',
                        borderRadius: '10px',
                        padding: '15px',
                        marginBottom: '15px'
                    }}
                >
                    <h3>{service.title}</h3>

                    <p>{service.description}</p>

                    <p><strong>Цена:</strong> {service.price} ₽</p>

                    <p><strong>Срок:</strong> {service.deadline} дн.</p>

                    <p><strong>Монтажёр:</strong> {service.editor_name}</p>

                    <p><strong>Город:</strong> {service.editor_city}</p>

                    {user?.user_id === service.user_id && (
                        <div>
                            <button onClick={() => startEdit(service)}>
                                Редактировать
                            </button>
                            <button onClick={() => deleteService(service.service_id)}>
                                Удалить услугу
                            </button>
                        </div>
                    )}

                </div>
            ))}
        </div>
    );
}

export default Services;
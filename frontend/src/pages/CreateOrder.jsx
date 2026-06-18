import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function CreateOrder() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    budget: '',
    deadline: '',
    video_type: ''
  });

  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');

    try {
      const response = await api.post(
        '/orders',
        {
          ...form,
          budget: Number(form.budget)
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMessage(response.data.message || 'Заказ успешно создан');
      setIsSuccess(true);

      setForm({
        title: '',
        description: '',
        budget: '',
        deadline: '',
        video_type: ''
      });

      setTimeout(() => {
        navigate('/my-orders');
      }, 1000);

    } catch (error) {
      setMessage(error.response?.data?.message || 'Ошибка создания заказа');
      setIsSuccess(false);
    }
  };

  return (
    <div className="page">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Создать заказ</h2>

        <p className="empty-text">
          Заполните информацию о проекте, чтобы монтажёры могли откликнуться на заказ.
        </p>
      </div>

      {message && (
        <div className="card">
          <strong style={{ color: isSuccess ? '#86efac' : '#fca5a5' }}>
            {message}
          </strong>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          maxWidth: '700px',
          margin: '0 auto'
        }}
      >
        <h3 style={{ marginTop: 0 }}>Информация о заказе</h3>

        <label>
          <strong>Название заказа</strong>

          <input
            name="title"
            placeholder="Например: Монтаж ролика для YouTube"
            value={form.title}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              marginTop: '6px'
            }}
          />
        </label>

        <label>
          <strong>Описание</strong>

          <textarea
            name="description"
            placeholder="Опишите задачу: длительность видео, стиль монтажа, исходные материалы, пожелания"
            value={form.description}
            onChange={handleChange}
            rows="6"
            required
            style={{
              width: '100%',
              marginTop: '6px'
            }}
          />
        </label>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px'
          }}
        >
          <label>
            <strong>Бюджет, ₽</strong>

            <input
              name="budget"
              type="number"
              min="1"
              placeholder="Например: 5000"
              value={form.budget}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                marginTop: '6px'
              }}
            />
          </label>

          <label>
            <strong>Срок выполнения</strong>

            <input
              name="deadline"
              type="date"
              min={today}
              value={form.deadline}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                marginTop: '6px'
              }}
            />
          </label>
        </div>

        <label>
          <strong>Тип видео</strong>

          <select
            name="video_type"
            value={form.video_type}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              marginTop: '6px'
            }}
          >
            <option value="">Выберите тип видео</option>
            <option value="YouTube">YouTube</option>
            <option value="Shorts / Reels / TikTok">Shorts / Reels / TikTok</option>
            <option value="Рекламный ролик">Рекламный ролик</option>
            <option value="Свадебное видео">Свадебное видео</option>
            <option value="Музыкальный клип">Музыкальный клип</option>
            <option value="Корпоративное видео">Корпоративное видео</option>
            <option value="Обучающее видео">Обучающее видео</option>
            <option value="Другое">Другое</option>
          </select>
        </label>

        <div
          style={{
            background: '#0f172a',
            border: '1px solid #374151',
            borderRadius: '12px',
            padding: '14px'
          }}
        >
          <strong>Подсказка:</strong>

          <p className="empty-text" style={{ marginBottom: 0 }}>
            Чем подробнее описание заказа, тем выше шанс получить подходящие отклики от монтажёров.
          </p>
        </div>

        <button type="submit">
          Создать заказ
        </button>
      </form>
    </div>
  );
}

export default CreateOrder;
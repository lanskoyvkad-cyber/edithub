import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';

function Chats() {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');

  const messagesEndRef = useRef(null);

  const [searchParams] = useSearchParams();

  const chatIdParam = searchParams.get('chatId');
  const chatIdFromUrl = chatIdParam ? Number(chatIdParam) : null;

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  const selectedChatData = chats.find(
    (chat) => Number(chat.chat_id) === Number(selectedChat)
  );

  const loadMessages = async (chatId) => {
    try {
      setSelectedChat(Number(chatId));

      const response = await api.get(`/chats/${chatId}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setMessages(response.data.messages || []);
    } catch (error) {
      console.error(error);
      alert(
        error.response?.data?.message ||
        'Ошибка загрузки сообщений'
      );
    }
  };

  const loadChats = async () => {
    try {
      const response = await api.get('/chats', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const loadedChats = response.data.chats || [];

      setChats(loadedChats);

      if (chatIdFromUrl) {
        loadMessages(chatIdFromUrl);
      }
    } catch (error) {
      console.error(error);
      alert(
        error.response?.data?.message ||
        'Ошибка загрузки чатов'
      );
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!message.trim() || !selectedChat) return;

    try {
      await api.post(
        `/chats/${selectedChat}/messages`,
        {
          message
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMessage('');
      loadMessages(selectedChat);
    } catch (error) {
      console.error(error);
      alert(
        error.response?.data?.message ||
        'Ошибка отправки сообщения'
      );
    }
  };

  useEffect(() => {
    loadChats();
  }, [chatIdFromUrl]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="page">
      <h2>Чаты</h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 340px) 1fr',
          gap: '20px',
          alignItems: 'start'
        }}
      >
        <div
          className="card"
          style={{
            height: 'calc(100vh - 150px)',
            overflowY: 'auto'
          }}
        >
          <h3 style={{ marginTop: 0 }}>Мои чаты</h3>

          {chats.length === 0 ? (
            <p className="empty-text">Чатов пока нет.</p>
          ) : (
            chats.map((chat) => {
              const isActive = Number(selectedChat) === Number(chat.chat_id);

              return (
                <div
                  key={chat.chat_id}
                  onClick={() => loadMessages(chat.chat_id)}
                  style={{
                    background: isActive ? '#1e3a8a' : '#111827',
                    border: isActive
                      ? '2px solid #60a5fa'
                      : '1px solid #374151',
                    padding: '14px',
                    marginBottom: '12px',
                    cursor: 'pointer',
                    borderRadius: '12px',
                    transition: '0.2s'
                  }}
                >
                  <p style={{ margin: '0 0 6px' }}>
                    <strong>Заказчик:</strong>{' '}
                    {chat.client_name || 'Не указан'}
                  </p>

                  <p style={{ margin: 0 }}>
                    <strong>Монтажёр:</strong>{' '}
                    {chat.editor_name || 'Не указан'}
                  </p>
                </div>
              );
            })
          )}
        </div>

        <div
          className="card"
          style={{
            height: 'calc(100vh - 150px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              borderBottom: '1px solid #374151',
              paddingBottom: '12px',
              marginBottom: '12px'
            }}
          >
            <h3 style={{ margin: 0 }}>Сообщения</h3>

            {selectedChatData && (
              <p className="empty-text" style={{ marginBottom: 0 }}>
                {selectedChatData.client_name} ↔ {selectedChatData.editor_name}
              </p>
            )}
          </div>

          {!selectedChat && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center'
              }}
            >
              <p className="empty-text">
                Выберите чат слева или откройте чат через профиль монтажёра.
              </p>
            </div>
          )}

          {selectedChat && (
            <>
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: 'auto',
                  paddingRight: '8px',
                  marginBottom: '15px'
                }}
              >
                {messages.length === 0 ? (
                  <p className="empty-text">
                    Сообщений пока нет. Напишите первое сообщение.
                  </p>
                ) : (
                  messages.map((msg) => {
                    const isMine =
                      Number(msg.sender_id) === Number(user?.user_id) ||
                      Number(msg.user_id) === Number(user?.user_id);

                    return (
                      <div
                        key={msg.message_id}
                        style={{
                          display: 'flex',
                          justifyContent: isMine ? 'flex-end' : 'flex-start',
                          marginBottom: '10px'
                        }}
                      >
                        <div
                          style={{
                            maxWidth: '70%',
                            background: isMine ? '#2563eb' : '#1f2937',
                            border: '1px solid #374151',
                            borderRadius: '14px',
                            padding: '10px 12px',
                            wordBreak: 'break-word'
                          }}
                        >
                          <div
                            style={{
                              fontSize: '13px',
                              color: isMine ? '#dbeafe' : '#9ca3af',
                              marginBottom: '4px'
                            }}
                          >
                            {msg.sender_name || 'Пользователь'}
                          </div>

                          <div>
                            {msg.message}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                <div ref={messagesEndRef} />
              </div>

              <form
                onSubmit={sendMessage}
                style={{
                  display: 'flex',
                  gap: '10px',
                  paddingTop: '12px',
                  borderTop: '1px solid #374151'
                }}
              >
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Введите сообщение"
                  style={{
                    flex: 1,
                    margin: 0
                  }}
                />

                <button type="submit">
                  Отправить
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Chats;
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';

function Chats() {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [unreadByChat, setUnreadByChat] = useState({});

  const [complaintMessageId, setComplaintMessageId] = useState(null);
  const [complaintReason, setComplaintReason] = useState('');
  const [complaintDescription, setComplaintDescription] = useState('');

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const shouldScrollToBottomRef = useRef(false);

  const [searchParams] = useSearchParams();

  const chatIdParam = searchParams.get('chatId');
  const chatIdFromUrl = chatIdParam ? Number(chatIdParam) : null;

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  const selectedChatData = chats.find(
    (chat) => Number(chat.chat_id) === Number(selectedChat)
  );

  const isMessagesScrolledToBottom = () => {
    const container = messagesContainerRef.current;

    if (!container) return true;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    return distanceFromBottom < 80;
  };

  const jumpMessagesToBottom = () => {
    const container = messagesContainerRef.current;

    if (!container) return;

    container.scrollTop = container.scrollHeight;
  };

  const getFileUrl = (fileUrl) => {
    if (!fileUrl) return '';

    if (fileUrl.startsWith('http')) {
      return fileUrl;
    }

    const backendUrl = api.defaults.baseURL.replace('/api', '');

    return `${backendUrl}${fileUrl}`;
  };

  const isImageFile = (fileType) => {
    return fileType?.startsWith('image/');
  };

  const isVideoFile = (fileType) => {
    return fileType?.startsWith('video/');
  };

  const formatDateTime = (date) => {
    if (!date) return '';

    return new Date(date).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const loadUnreadChatNotifications = async () => {
    try {
      const response = await api.get('/notifications', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const counts = {};

      (response.data.notifications || []).forEach((item) => {
        if (
          !item.is_read &&
          item.title === 'Новое сообщение' &&
          item.chat_id
        ) {
          const chatId = Number(item.chat_id);
          counts[chatId] = (counts[chatId] || 0) + 1;
        }
      });

      setUnreadByChat(counts);
    } catch (error) {
      console.error(error);
    }
  };

  const markChatAsRead = async (chatId) => {
    try {
      await api.patch(
        `/chats/${chatId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setUnreadByChat((prev) => {
        const updated = { ...prev };
        delete updated[Number(chatId)];
        return updated;
      });

      window.dispatchEvent(new Event('notifications-updated'));
    } catch (error) {
      console.error(error);
    }
  };

  const loadMessages = async (chatId) => {
    try {
      setSelectedChat(Number(chatId));

      await markChatAsRead(chatId);

      const response = await api.get(`/chats/${chatId}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      shouldScrollToBottomRef.current = true;
      setMessages(response.data.messages || []);

    } catch (error) {
      console.error(error);
      alert(
        error.response?.data?.message ||
        'Ошибка загрузки сообщений'
      );
    }
  };

  const refreshMessages = async (chatId) => {
    try {
      const response = await api.get(`/chats/${chatId}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setMessages(response.data.messages || []);

    } catch (error) {
      console.error(error);
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

      await loadUnreadChatNotifications();
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

    if (!message.trim() && !selectedFile) return;
    if (!selectedChat) return;

    try {
      if (selectedFile) {
        const formData = new FormData();

        formData.append('file', selectedFile);
        formData.append('message', message);

        await api.post(
          `/chats/${selectedChat}/files`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
      } else {
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
      }

      setMessage('');
      setSelectedFile(null);

      await loadMessages(selectedChat);
      await loadChats();

    } catch (error) {
      console.error(error);
      alert(
        error.response?.data?.message ||
        'Ошибка отправки сообщения'
      );
    }
  };

  const sendMessageComplaint = async (e) => {
    e.preventDefault();

    if (!complaintMessageId) {
      alert('Сообщение для жалобы не выбрано');
      return;
    }

    if (!complaintReason.trim()) {
      alert('Выберите причину жалобы');
      return;
    }

    try {
      await api.post(
        '/complaints',
        {
          target_type: 'MESSAGE',
          target_id: Number(complaintMessageId),
          reason: complaintReason,
          description: complaintDescription
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert('Жалоба на сообщение отправлена');

      setComplaintMessageId(null);
      setComplaintReason('');
      setComplaintDescription('');

    } catch (error) {
      console.error(error);
      alert(
        error.response?.data?.message ||
        'Ошибка отправки жалобы'
      );
    }
  };

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (chatIdFromUrl && !selectedChat) {
      loadMessages(chatIdFromUrl);
    }
  }, [chatIdFromUrl, selectedChat]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadChats();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedChat) return;

    const interval = setInterval(() => {
      refreshMessages(selectedChat);
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedChat]);

  useLayoutEffect(() => {
    if (!shouldScrollToBottomRef.current) return;

    shouldScrollToBottomRef.current = false;

    jumpMessagesToBottom();
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
              const unreadCount = unreadByChat[Number(chat.chat_id)] || 0;

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
                  {chat.last_message ? (
                    <div style={{ marginTop: '10px' }}>
                      <p
                        className="empty-text"
                        style={{
                          margin: '0 0 4px',
                          fontSize: '13px'
                        }}
                      >
                        <strong>Последнее:</strong>{' '}
                        {chat.last_sender_name || 'Пользователь'}:{' '}
                        {chat.last_message.length > 45
                          ? chat.last_message.slice(0, 45) + '...'
                          : chat.last_message}
                      </p>

                      <p
                        className="empty-text"
                        style={{
                          margin: 0,
                          fontSize: '12px'
                        }}
                      >
                        {formatDateTime(chat.last_message_at)}
                      </p>
                    </div>
                  ) : (
                    <p
                      className="empty-text"
                      style={{
                        marginTop: '10px',
                        fontSize: '13px'
                      }}
                    >
                      Сообщений пока нет
                    </p>
                  )}
                  {unreadCount > 0 && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: '10px',
                        minWidth: '24px',
                        height: '24px',
                        padding: '0 8px',
                        borderRadius: '999px',
                        background: '#dc2626',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: '700'
                      }}
                    >
                      Новых: {unreadCount}
                    </span>
                  )}
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
                ref={messagesContainerRef}
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
                            maxWidth: msg.file_url ? '280px' : '70%',
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

                          {msg.message && msg.message !== 'Файл' && (
                            <div>
                              {msg.message}
                            </div>
                          )}

                          {msg.file_url && (
                            <div style={{ marginTop: msg.message && msg.message !== 'Файл' ? '10px' : 0 }}>
                              {isImageFile(msg.file_type) && (
                                <img
                                  src={getFileUrl(msg.file_url)}
                                  alt={msg.file_name || 'Файл'}
                                  style={{
                                    maxWidth: '100%',
                                    borderRadius: '10px',
                                    marginBottom: '8px'
                                  }}
                                />
                              )}

                              {isVideoFile(msg.file_type) && (
                                <video
                                  controls
                                  src={getFileUrl(msg.file_url)}
                                  style={{
                                    width: '220px',
                                    aspectRatio: '9 / 16',
                                    maxWidth: '100%',
                                    borderRadius: '10px',
                                    marginBottom: '8px',
                                    background: '#000',
                                    objectFit: 'cover'
                                  }}
                                />
                              )}

                              <a
                                href={getFileUrl(msg.file_url)}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  color: '#bfdbfe',
                                  fontWeight: '700'
                                }}
                              >
                                {msg.file_name?.length > 28
                                  ? msg.file_name.slice(0, 28) + '...'
                                  : msg.file_name || 'Скачать файл'}
                              </a>
                            </div>
                          )}

                          {isMine && (
                            <div
                              style={{
                                fontSize: '11px',
                                color: '#bfdbfe',
                                marginTop: '6px',
                                textAlign: 'right'
                              }}
                            >
                              {msg.is_read ? 'Прочитано' : 'Отправлено'}
                            </div>
                          )}
                          {!isMine && (
                            <button
                              type="button"
                              onClick={() => {
                                setComplaintMessageId(Number(msg.message_id));
                                setComplaintReason('');
                                setComplaintDescription('');
                              }}
                              style={{
                                marginTop: '8px',
                                padding: '4px 8px',
                                fontSize: '11px',
                                background: '#b45309'
                              }}
                            >
                              Пожаловаться
                            </button>
                          )}
                          {complaintMessageId === Number(msg.message_id) && (
                            <form
                              onSubmit={sendMessageComplaint}
                              style={{
                                marginTop: '10px',
                                paddingTop: '10px',
                                borderTop: '1px solid #4b5563',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px'
                              }}
                            >
                              <select
                                value={complaintReason}
                                onChange={(e) => setComplaintReason(e.target.value)}
                                required
                                style={{
                                  fontSize: '13px'
                                }}
                              >
                                <option value="">Причина жалобы</option>
                                <option value="Оскорбление">Оскорбление</option>
                                <option value="Спам">Спам</option>
                                <option value="Мошенничество">Мошенничество</option>
                                <option value="Неподходящий контент">Неподходящий контент</option>
                                <option value="Другое">Другое</option>
                              </select>

                              <textarea
                                placeholder="Комментарий к жалобе"
                                value={complaintDescription}
                                onChange={(e) => setComplaintDescription(e.target.value)}
                                rows="3"
                                style={{
                                  fontSize: '13px'
                                }}
                              />

                              <div
                                style={{
                                  display: 'flex',
                                  gap: '8px',
                                  flexWrap: 'wrap'
                                }}
                              >
                                <button
                                  type="submit"
                                  style={{
                                    padding: '5px 9px',
                                    fontSize: '12px'
                                  }}
                                >
                                  Отправить
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setComplaintMessageId(null);
                                    setComplaintReason('');
                                    setComplaintDescription('');
                                  }}
                                  style={{
                                    padding: '5px 9px',
                                    fontSize: '12px',
                                    background: '#374151'
                                  }}
                                >
                                  Отмена
                                </button>
                              </div>
                            </form>
                          )}
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

                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 12px',
                    borderRadius: '8px',
                    background: '#374151',
                    cursor: 'pointer',
                    color: '#ffffff',
                    fontWeight: '700'
                  }}
                >
                  📎
                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                    style={{ display: 'none' }}
                  />
                </label>

                <button type="submit">
                  Отправить
                </button>
              </form>
              {selectedFile && (
                <p className="empty-text" style={{ marginTop: '8px' }}>
                  Выбран файл: {selectedFile.name}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Chats;
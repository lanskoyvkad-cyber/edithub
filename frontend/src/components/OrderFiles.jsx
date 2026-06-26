import { useEffect, useState } from 'react';
import api from '../services/api';

function OrderFiles({ orderId, canUpload = false }) {
    const token = localStorage.getItem('token');

    const [files, setFiles] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasAccess, setHasAccess] = useState(true);

    const getFileUrl = (fileUrl) => {
        if (!fileUrl) return '';

        if (fileUrl.startsWith('http')) {
            return fileUrl;
        }

        const backendUrl = api.defaults.baseURL.replace('/api', '');

        return `${backendUrl}${fileUrl}`;
    };

    const formatFileSize = (size) => {
        if (!size) return '';

        if (size < 1024 * 1024) {
            return `${Math.round(size / 1024)} КБ`;
        }

        return `${(size / 1024 / 1024).toFixed(1)} МБ`;
    };

    const loadFiles = async () => {
        try {
            setHasAccess(true);

            const response = await api.get(`/order-files/${orderId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setFiles(response.data.files || []);
        } catch (error) {
            console.error(error);

            if (error.response?.status === 403) {
                setHasAccess(false);
            }
        }
    };

    const uploadFile = async (e) => {
        e.preventDefault();

        if (selectedFiles.length === 0) {
            alert('Выберите один или несколько файлов');
            return;
        }

        try {
            setLoading(true);

            for (const file of selectedFiles) {
                const formData = new FormData();

                formData.append('file', file);

                await api.post(
                    `/order-files/${orderId}`,
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );
            }

            setSelectedFiles([]);
            await loadFiles();

            alert('Файлы прикреплены к заказу');
        } catch (error) {
            console.error(error);
            alert(
                error.response?.data?.message ||
                'Ошибка загрузки файлов'
            );
        } finally {
            setLoading(false);
        }
    };

    const deleteFile = async (fileId) => {
        const confirmed = window.confirm('Удалить файл?');

        if (!confirmed) return;

        try {
            await api.delete(`/order-files/file/${fileId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            await loadFiles();
        } catch (error) {
            console.error(error);
            alert(
                error.response?.data?.message ||
                'Ошибка удаления файла'
            );
        }
    };

    useEffect(() => {
        if (orderId) {
            loadFiles();
        }
    }, [orderId]);

    if (!hasAccess) {
        return null;
    }

    return (
        <div
            style={{
                marginTop: '15px',
                paddingTop: '15px',
                borderTop: '1px solid #374151'
            }}
        >
            <h4 style={{ marginTop: 0 }}>
                Файлы заказа
            </h4>

            {canUpload && (
                <form
                    onSubmit={uploadFile}
                    style={{
                        marginBottom: '16px'
                    }}
                >
                    <label
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '9px 14px',
                            borderRadius: '8px',
                            background: '#2563eb',
                            color: '#ffffff',
                            fontWeight: '700',
                            cursor: 'pointer',
                            width: 'fit-content',
                            marginRight: '10px'
                        }}
                    >
                        Выбрать файлы

                        <input
                            type="file"
                            multiple
                            onChange={(e) => {
                                const newFiles = Array.from(e.target.files);

                                setSelectedFiles((prevFiles) => [
                                    ...prevFiles,
                                    ...newFiles
                                ]);

                                e.target.value = '';
                            }}
                            style={{
                                display: 'none'
                            }}
                        />
                    </label>

                    <button type="submit" disabled={loading}>
                        {loading ? 'Загрузка...' : 'Прикрепить файлы'}
                    </button>

                    {selectedFiles.length > 0 && (
                        <div style={{ marginTop: '12px' }}>
                            <p className="empty-text" style={{ marginBottom: '8px' }}>
                                Выбрано файлов: {selectedFiles.length}
                            </p>

                            {selectedFiles.map((file, index) => (
                                <div
                                    key={`${file.name}-${index}`}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        gap: '10px',
                                        alignItems: 'center',
                                        marginBottom: '8px',
                                        padding: '10px',
                                        borderRadius: '10px',
                                        background: '#111827',
                                        border: '1px solid #374151',
                                        maxWidth: '100%',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <span
                                        className="empty-text"
                                        style={{
                                            flex: 1,
                                            minWidth: 0,
                                            overflowWrap: 'anywhere',
                                            wordBreak: 'break-word'
                                        }}
                                    >
                                        📎 {file.name}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedFiles((prevFiles) =>
                                                prevFiles.filter((_, fileIndex) => fileIndex !== index)
                                            );
                                        }}
                                        style={{
                                            padding: '4px 8px',
                                            background: '#dc2626',
                                            fontSize: '12px',
                                            flexShrink: 0
                                        }}
                                    >
                                        Убрать
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </form>
            )}

            {files.length === 0 ? (
                <p className="empty-text">
                    Файлы пока не прикреплены.
                </p>
            ) : (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                    }}
                >
                    {files.map((file) => (
                        <div
                            key={file.order_file_id}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                gap: '10px',
                                alignItems: 'center',
                                padding: '10px',
                                borderRadius: '10px',
                                background: '#111827',
                                border: '1px solid #374151',
                                flexWrap: 'wrap',
                                maxWidth: '100%',
                                overflow: 'hidden'
                            }}
                        >
                            <div
                                style={{
                                    flex: 1,
                                    minWidth: 0
                                }}
                            >
                                <a
                                    href={getFileUrl(file.file_url)}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                        color: '#bfdbfe',
                                        fontWeight: '700',
                                        overflowWrap: 'anywhere',
                                        wordBreak: 'break-word'
                                    }}
                                >
                                    📎 {file.file_name || 'Файл'}
                                </a>

                                <p
                                    className="empty-text"
                                    style={{
                                        margin: '4px 0 0',
                                        fontSize: '12px'
                                    }}
                                >
                                    {file.uploaded_by_name && (
                                        <>
                                            Загрузил: {file.uploaded_by_name}
                                            {' · '}
                                        </>
                                    )}

                                    {formatFileSize(file.file_size)}

                                    {file.created_at && (
                                        <>
                                            {' · '}
                                            {new Date(file.created_at).toLocaleString('ru-RU')}
                                        </>
                                    )}
                                </p>
                            </div>

                            {canUpload && (
                                <button
                                    type="button"
                                    onClick={() => deleteFile(file.order_file_id)}
                                    style={{
                                        background: '#dc2626',
                                        padding: '6px 10px',
                                        flexShrink: 0
                                    }}
                                >
                                    Удалить
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default OrderFiles;
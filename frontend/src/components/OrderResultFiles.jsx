import { useEffect, useState } from 'react';
import api from '../services/api';

function OrderResultFiles({ orderId, canUpload = false }) {
    const token = localStorage.getItem('token');

    const [files, setFiles] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasAccess, setHasAccess] = useState(true);

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

            const response = await api.get(`/order-results/${orderId}`, {
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

    const uploadFiles = async (e) => {
        e.preventDefault();

        if (selectedFiles.length === 0) {
            alert('Выберите один или несколько файлов результата');
            return;
        }

        try {
            setLoading(true);

            for (const file of selectedFiles) {
                const formData = new FormData();
                formData.append('file', file);

                await api.post(`/order-results/${orderId}`, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
            }

            setSelectedFiles([]);
            await loadFiles();

            alert('Результат работы загружен');
        } catch (error) {
            console.error(error);
            alert(
                error.response?.data?.message ||
                'Ошибка загрузки результата'
            );
        } finally {
            setLoading(false);
        }
    };

    const downloadFile = async (file) => {
        try {
            const response = await api.get(
                `/order-results/file/${file.result_file_id}/download`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    responseType: 'blob'
                }
            );

            const blobUrl = window.URL.createObjectURL(new Blob([response.data]));

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = file.file_name || 'result-file';

            document.body.appendChild(link);
            link.click();

            link.remove();
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error(error);
            alert(
                error.response?.data?.message ||
                'Ошибка скачивания результата'
            );
        }
    };

    const deleteFile = async (fileId) => {
        const confirmed = window.confirm('Удалить файл результата?');

        if (!confirmed) return;

        try {
            await api.delete(`/order-results/file/${fileId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            await loadFiles();
        } catch (error) {
            console.error(error);
            alert(
                error.response?.data?.message ||
                'Ошибка удаления результата'
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
                Результат работы
            </h4>

            {canUpload && (
                <form
                    onSubmit={uploadFiles}
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
                        Выбрать результат

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
                        {loading ? 'Загрузка...' : 'Отправить результат'}
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
                    Результат пока не загружен.
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
                            key={file.result_file_id}
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
                                <button
                                    type="button"
                                    onClick={() => downloadFile(file)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        padding: 0,
                                        color: '#bfdbfe',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        overflowWrap: 'anywhere',
                                        wordBreak: 'break-word'
                                    }}
                                >
                                    📎 {file.file_name || 'Файл результата'}
                                </button>

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
                                    onClick={() => deleteFile(file.result_file_id)}
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

export default OrderResultFiles;
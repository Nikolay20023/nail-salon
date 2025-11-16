import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getTelegramUser, showAlert, showConfirm } from '../utils/telegram'
import { api, Booking } from '../utils/api'
import '../styles/App.css'

function DeleteBooking() {
  const { id } = useParams<{ id: string }>()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const user = getTelegramUser()

  useEffect(() => {
    if (id) {
      loadBooking(Number(id))
    }
  }, [id])

  const loadBooking = async (bookingId: number) => {
    try {
      setLoading(true)
      const data = await api.getBooking(bookingId)
      setBooking(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки записи')
      showAlert('Не удалось загрузить запись')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long'
    })
  }

  const handleDelete = async () => {
    if (!id || !booking) return

    const confirmed = await showConfirm(
      `Вы уверены, что хотите удалить запись на ${formatDate(booking.date)} в ${booking.time}?`
    )

    if (!confirmed) return

    if (!user?.id) {
      setError('Пользователь не найден')
      return
    }

    setDeleting(true)
    setError(null)

    try {
      await api.deleteBooking(Number(id), user.id)
      showAlert('Запись успешно удалена!')
      navigate('/my-booking')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка при удалении записи'
      setError(message)
      showAlert(message)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Загрузка...</div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="container">
        <div className="error">Запись не найдена</div>
        <button className="btn" onClick={() => navigate('/my-booking')}>
          Вернуться к записям
        </button>
      </div>
    )
  }

  return (
    <div className="container">
      <h1 className="page-title">Удалить запись</h1>

      {error && <div className="error">{error}</div>}

      <div className="card">
        <div className="card-title">Информация о записи</div>
        <div className="card-text">
          📅 {formatDate(booking.date)}
        </div>
        <div className="card-text">
          🕐 {booking.time}
        </div>
        {booking.service && (
          <div className="card-text">
            💅 {booking.service}
          </div>
        )}
        {booking.master_full_name && (
          <div className="card-text">
            👤 Мастер: {booking.master_full_name}
          </div>
        )}
        {booking.status && (
          <div className="card-text">
            Статус: {booking.status}
          </div>
        )}
      </div>

      <div className="card" style={{ backgroundColor: '#fff3cd', border: '1px solid #ffc107' }}>
        <div className="card-title" style={{ color: '#856404' }}>
          ⚠️ Внимание
        </div>
        <div className="card-text" style={{ color: '#856404' }}>
          Вы собираетесь удалить эту запись. Это действие нельзя отменить.
        </div>
      </div>

      <button
        className="btn btn-danger"
        onClick={handleDelete}
        disabled={deleting}
      >
        {deleting ? 'Удаление...' : 'Удалить запись'}
      </button>

      <button
        className="btn btn-secondary"
        onClick={() => navigate('/my-booking')}
        disabled={deleting}
      >
        Отмена
      </button>
    </div>
  )
}

export default DeleteBooking


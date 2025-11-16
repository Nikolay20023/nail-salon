import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTelegramUser, showAlert, showConfirm } from '../../utils/telegram'
import { api, Booking } from '../../utils/api'
import '../../styles/App.css'

function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const user = getTelegramUser()

  useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getAdminBookings(user.id)
      setBookings(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка загрузки бронирований'
      setError(message)
      showAlert(message)
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
    })
  }

  const handleStatusChange = async (bookingId: number, newStatus: string) => {
    try {
      await api.updateBookingStatus(bookingId, newStatus, user.id)
      showAlert('Статус изменен')
      loadBookings()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка изменения статуса'
      showAlert(message)
    }
  }

  const handleDelete = async (bookingId: number) => {
    const confirmed = await showConfirm('Удалить это бронирование?')
    if (!confirmed) return

    try {
      await api.deleteAdminBooking(bookingId, user.id)
      showAlert('Бронирование удалено')
      loadBookings()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка удаления'
      showAlert(message)
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'confirmed': return '#34c759'
      case 'cancelled': return '#ff3b30'
      case 'completed': return '#007aff'
      default: return '#ff9500'
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="container">
      <h1 className="page-title">📅 Бронирования</h1>

      {error && <div className="error">{error}</div>}

      {bookings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <p>Бронирований нет</p>
        </div>
      ) : (
        bookings.map((booking) => (
          <div key={booking.id} className="card">
            <div className="card-title">Бронирование #{booking.id}</div>
            <div className="card-text">📅 {formatDate(booking.date)}</div>
            <div className="card-text">🕐 {booking.time}</div>
            {booking.service && (
              <div className="card-text">💅 {booking.service}</div>
            )}
            {booking.master_full_name && (
              <div className="card-text">👤 Мастер: {booking.master_full_name}</div>
            )}
            {booking.client_name && (
              <div className="card-text">👤 Клиент: {booking.client_name}</div>
            )}
            {booking.client_phone && (
              <div className="card-text">📞 {booking.client_phone}</div>
            )}
            <div className="card-text">
              Статус:{' '}
              <span style={{ color: getStatusColor(booking.status) }}>
                {booking.status || 'new'}
              </span>
            </div>

            <div className="form-group" style={{ marginTop: '12px' }}>
              <label className="form-label">Изменить статус:</label>
              <select
                className="form-select"
                value={booking.status || 'new'}
                onChange={(e) => handleStatusChange(booking.id, e.target.value)}
              >
                <option value="new">Новое</option>
                <option value="confirmed">Подтверждено</option>
                <option value="cancelled">Отменено</option>
                <option value="completed">Завершено</option>
              </select>
            </div>

            <button
              className="btn btn-danger"
              onClick={() => handleDelete(booking.id)}
              style={{ marginTop: '8px' }}
            >
              Удалить
            </button>
          </div>
        ))
      )}

      <button className="btn btn-secondary" onClick={() => navigate('/admin')}>
        ← Назад
      </button>
    </div>
  )
}

export default AdminBookings


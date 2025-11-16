import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTelegramUser, showAlert } from '../utils/telegram'
import { api, Booking } from '../utils/api'
import '../styles/App.css'

function MyBooking() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const user = getTelegramUser()

  useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = async () => {
    if (!user?.id) {
      setError('Пользователь не найден')
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const data = await api.getBookings(user.id)
      setBookings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки записей')
      showAlert('Не удалось загрузить записи')
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

  const handleCreateBooking = () => {
    navigate('/create-booking')
  }

  const handleUpdateBooking = (id: number) => {
    navigate(`/update-booking/${id}`)
  }

  const handleDeleteBooking = (id: number) => {
    navigate(`/delete-booking/${id}`)
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
      <h1 className="page-title">Мои записи</h1>

      {error && <div className="error">{error}</div>}

      {bookings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <p>У вас пока нет записей</p>
          <button className="btn" onClick={handleCreateBooking}>
            Создать запись
          </button>
        </div>
      ) : (
        <>
          {bookings.map((booking) => (
            <div key={booking.id} className="card">
              <div className="card-title">
                {booking.service || 'Услуга не указана'}
              </div>
              <div className="card-text">
                📅 {formatDate(booking.date)}
              </div>
              <div className="card-text">
                🕐 {booking.time}
              </div>
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
              <div className="booking-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => handleUpdateBooking(booking.id)}
                >
                  Изменить
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDeleteBooking(booking.id)}
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
          <button className="btn" onClick={handleCreateBooking}>
            + Создать новую запись
          </button>
        </>
      )}
    </div>
  )
}

export default MyBooking


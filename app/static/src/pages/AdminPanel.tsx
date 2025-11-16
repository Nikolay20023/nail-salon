import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTelegramUser, showAlert } from '../utils/telegram'
import { api } from '../utils/api'
import '../styles/App.css'

function AdminPanel() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const user = getTelegramUser()

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getAdminStats(user.id)
      setStats(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка загрузки статистики'
      setError(message)
      if (message.includes('403') || message.includes('Доступ запрещен')) {
        showAlert('У вас нет прав администратора')
        navigate('/my-booking')
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Загрузка...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">{error}</div>
        <button className="btn" onClick={() => navigate('/my-booking')}>
          Вернуться
        </button>
      </div>
    )
  }

  return (
    <div className="container">
      <h1 className="page-title">⚙️ Админ панель</h1>

      {stats && (
        <div className="card">
          <div className="card-title">📊 Статистика</div>
          <div className="card-text">👥 Пользователей: {stats.users}</div>
          <div className="card-text">💅 Услуг: {stats.services}</div>
          <div className="card-text">👤 Мастеров: {stats.masters}</div>
          <div className="card-text">📅 Бронирований: {stats.bookings}</div>
          {stats.bookings_by_status && (
            <div style={{ marginTop: '12px' }}>
              <div className="card-text">Статусы бронирований:</div>
              {Object.entries(stats.bookings_by_status).map(([status, count]) => (
                <div key={status} className="card-text" style={{ marginLeft: '16px' }}>
                  - {status}: {count as number}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="card">
        <div className="card-title">Управление</div>
        <button className="btn" onClick={() => navigate('/admin/users')}>
          👥 Пользователи
        </button>
        <button className="btn" onClick={() => navigate('/admin/services')}>
          💅 Услуги
        </button>
        <button className="btn" onClick={() => navigate('/admin/masters')}>
          👤 Мастера
        </button>
        <button className="btn" onClick={() => navigate('/admin/bookings')}>
          📅 Бронирования
        </button>
      </div>

      <button className="btn btn-secondary" onClick={() => navigate('/my-booking')}>
        Вернуться
      </button>
    </div>
  )
}

export default AdminPanel


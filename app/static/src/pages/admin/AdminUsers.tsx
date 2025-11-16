import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTelegramUser, showAlert, showConfirm } from '../../utils/telegram'
import { api, User } from '../../utils/api'
import '../../styles/App.css'

function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const user = getTelegramUser()

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getAdminUsers(user.id)
      setUsers(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка загрузки пользователей'
      setError(message)
      showAlert(message)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAdmin = async (userId: number) => {
    const confirmed = await showConfirm('Изменить статус администратора?')
    if (!confirmed) return

    try {
      await api.toggleUserAdmin(userId, user.id)
      showAlert('Статус изменен')
      loadUsers()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка изменения статуса'
      showAlert(message)
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
      <h1 className="page-title">👥 Пользователи</h1>

      {error && <div className="error">{error}</div>}

      {users.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <p>Пользователей нет</p>
        </div>
      ) : (
        users.map((u) => (
          <div key={u.id} className="card">
            <div className="card-title">
              {u.first_name || 'Без имени'} {u.last_name || ''}
            </div>
            <div className="card-text">ID: {u.id}</div>
            <div className="card-text">Telegram ID: {u.telegram_id}</div>
            {u.username && <div className="card-text">@{u.username}</div>}
            {u.phone && <div className="card-text">📞 {u.phone}</div>}
            <div className="card-text">
              Админ: {u.is_admin ? '✅ Да' : '❌ Нет'}
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => handleToggleAdmin(u.id)}
            >
              {u.is_admin ? 'Убрать админа' : 'Сделать админом'}
            </button>
          </div>
        ))
      )}

      <button className="btn" onClick={() => navigate('/admin')}>
        ← Назад
      </button>
    </div>
  )
}

export default AdminUsers


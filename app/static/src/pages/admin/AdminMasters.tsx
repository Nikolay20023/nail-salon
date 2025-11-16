import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTelegramUser, showAlert, showConfirm } from '../../utils/telegram'
import { api, Master } from '../../utils/api'
import '../../styles/App.css'

function AdminMasters() {
  const [masters, setMasters] = useState<Master[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingMaster, setEditingMaster] = useState<Master | null>(null)
  const navigate = useNavigate()
  const user = getTelegramUser()

  const [formData, setFormData] = useState({
    name: '',
    instagram: '',
    description: '',
    is_active: true,
  })

  useEffect(() => {
    loadMasters()
  }, [])

  const loadMasters = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getAdminMasters(user.id)
      setMasters(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка загрузки мастеров'
      setError(message)
      showAlert(message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (master: Master) => {
    setEditingMaster(master)
    setFormData({
      name: master.name,
      instagram: master.instagram || '',
      description: master.description || '',
      is_active: master.is_active ?? true,
    })
    setShowForm(true)
  }

  const handleDelete = async (masterId: number) => {
    const confirmed = await showConfirm('Удалить этого мастера?')
    if (!confirmed) return

    try {
      await api.deleteAdminMaster(masterId, user.id)
      showAlert('Мастер удален')
      loadMasters()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка удаления'
      showAlert(message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const masterData = {
        name: formData.name,
        instagram: formData.instagram || undefined,
        description: formData.description || undefined,
        is_active: formData.is_active,
      }

      if (editingMaster) {
        await api.updateAdminMaster(editingMaster.id, masterData, user.id)
        showAlert('Мастер обновлен')
      } else {
        await api.createAdminMaster(masterData, user.id)
        showAlert('Мастер создан')
      }

      setShowForm(false)
      setEditingMaster(null)
      setFormData({ name: '', instagram: '', description: '', is_active: true })
      loadMasters()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка сохранения'
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
      <h1 className="page-title">👤 Мастера</h1>

      {error && <div className="error">{error}</div>}

      {!showForm ? (
        <>
          <button className="btn" onClick={() => setShowForm(true)}>
            + Создать мастера
          </button>

          {masters.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👤</div>
              <p>Мастеров нет</p>
            </div>
          ) : (
            masters.map((master) => (
              <div key={master.id} className="card">
                <div className="card-title">{master.name}</div>
                {master.instagram && (
                  <div className="card-text">📷 Instagram: {master.instagram}</div>
                )}
                {master.description && (
                  <div className="card-text">{master.description}</div>
                )}
                <div className="card-text">
                  Статус: {master.is_active ? '✅ Активен' : '❌ Неактивен'}
                </div>
                <div className="booking-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleEdit(master)}
                  >
                    Изменить
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(master.id)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))
          )}

          <button className="btn btn-secondary" onClick={() => navigate('/admin')}>
            ← Назад
          </button>
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Имя *</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Instagram</label>
            <input
              type="text"
              className="form-input"
              value={formData.instagram}
              onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
              placeholder="@username"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Описание</label>
            <textarea
              className="form-input"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              {' '}Активен
            </label>
          </div>

          <button type="submit" className="btn">
            {editingMaster ? 'Сохранить' : 'Создать'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setShowForm(false)
              setEditingMaster(null)
              setFormData({ name: '', instagram: '', description: '', is_active: true })
            }}
          >
            Отмена
          </button>
        </form>
      )}
    </div>
  )
}

export default AdminMasters


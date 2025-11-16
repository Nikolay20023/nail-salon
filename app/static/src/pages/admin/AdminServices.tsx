import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTelegramUser, showAlert, showConfirm } from '../../utils/telegram'
import { api, Service } from '../../utils/api'
import '../../styles/App.css'

function AdminServices() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const navigate = useNavigate()
  const user = getTelegramUser()

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    duration_min: '',
    description: '',
    is_active: true,
  })

  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getAdminServices(user.id)
      setServices(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка загрузки услуг'
      setError(message)
      showAlert(message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      price: service.price.toString(),
      duration_min: service.duration_min.toString(),
      description: service.description || '',
      is_active: service.is_active ?? true,
    })
    setShowForm(true)
  }

  const handleDelete = async (serviceId: number) => {
    const confirmed = await showConfirm('Удалить эту услугу?')
    if (!confirmed) return

    try {
      await api.deleteAdminService(serviceId, user.id)
      showAlert('Услуга удалена')
      loadServices()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка удаления'
      showAlert(message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const serviceData = {
        name: formData.name,
        price: parseInt(formData.price),
        duration_min: parseInt(formData.duration_min),
        description: formData.description || undefined,
        is_active: formData.is_active,
      }

      if (editingService) {
        await api.updateAdminService(editingService.id, serviceData, user.id)
        showAlert('Услуга обновлена')
      } else {
        await api.createAdminService(serviceData, user.id)
        showAlert('Услуга создана')
      }

      setShowForm(false)
      setEditingService(null)
      setFormData({ name: '', price: '', duration_min: '', description: '', is_active: true })
      loadServices()
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
      <h1 className="page-title">💅 Услуги</h1>

      {error && <div className="error">{error}</div>}

      {!showForm ? (
        <>
          <button className="btn" onClick={() => setShowForm(true)}>
            + Создать услугу
          </button>

          {services.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💅</div>
              <p>Услуг нет</p>
            </div>
          ) : (
            services.map((service) => (
              <div key={service.id} className="card">
                <div className="card-title">{service.name}</div>
                <div className="card-text">💰 Цена: {service.price} ₽</div>
                <div className="card-text">⏱ Длительность: {service.duration_min} мин</div>
                {service.description && (
                  <div className="card-text">{service.description}</div>
                )}
                <div className="card-text">
                  Статус: {service.is_active ? '✅ Активна' : '❌ Неактивна'}
                </div>
                <div className="booking-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleEdit(service)}
                  >
                    Изменить
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(service.id)}
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
            <label className="form-label">Название *</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Цена (₽) *</label>
            <input
              type="number"
              className="form-input"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Длительность (мин) *</label>
            <input
              type="number"
              className="form-input"
              value={formData.duration_min}
              onChange={(e) => setFormData({ ...formData, duration_min: e.target.value })}
              required
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
              {' '}Активна
            </label>
          </div>

          <button type="submit" className="btn">
            {editingService ? 'Сохранить' : 'Создать'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setShowForm(false)
              setEditingService(null)
              setFormData({ name: '', price: '', duration_min: '', description: '', is_active: true })
            }}
          >
            Отмена
          </button>
        </form>
      )}
    </div>
  )
}

export default AdminServices


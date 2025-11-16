import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTelegramUser, showAlert } from '../utils/telegram'
import { api, Service, Master, BookingCreate } from '../utils/api'
import '../styles/App.css'

function CreateBooking() {
  const [services, setServices] = useState<Service[]>([])
  const [masters, setMasters] = useState<Master[]>([])
  const [selectedServiceId, setSelectedServiceId] = useState<number | ''>('')
  const [selectedMasterId, setSelectedMasterId] = useState<number | ''>('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const user = getTelegramUser()

  useEffect(() => {
    loadServices()
  }, [])

  useEffect(() => {
    if (selectedServiceId) {
      loadMasters(Number(selectedServiceId))
    } else {
      setMasters([])
    }
  }, [selectedServiceId])

  const loadServices = async () => {
    try {
      const data = await api.getServices()
      setServices(data)
    } catch (err) {
      showAlert('Не удалось загрузить услуги')
    }
  }

  const loadMasters = async (serviceId: number) => {
    try {
      const data = await api.getMasters(serviceId)
      setMasters(data)
    } catch (err) {
      showAlert('Не удалось загрузить мастеров')
    }
  }

  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 8; hour < 20; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`)
      slots.push(`${hour.toString().padStart(2, '0')}:30`)
    }
    return slots
  }

  const timeSlots = generateTimeSlots()

  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedServiceId || !selectedMasterId || !selectedDate || !selectedTime) {
      setError('Заполните все обязательные поля')
      return
    }

    if (!user?.id) {
      setError('Пользователь не найден')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const booking: BookingCreate = {
        user_id: user.id,
        service_id: Number(selectedServiceId),
        master_id: Number(selectedMasterId),
        date: selectedDate,
        time: selectedTime,
        client_name: clientName || undefined,
        client_phone: clientPhone || undefined,
      }

      await api.createBooking(booking)
      showAlert('Запись успешно создана!')
      navigate('/my-booking')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка при создании записи'
      setError(message)
      showAlert(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <h1 className="page-title">Создать запись</h1>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Услуга *</label>
          <select
            className="form-select"
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value ? Number(e.target.value) : '')}
            required
          >
            <option value="">Выберите услугу</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} - {service.price} ₽ ({service.duration_min} мин)
              </option>
            ))}
          </select>
        </div>

        {selectedServiceId && (
          <div className="form-group">
            <label className="form-label">Мастер *</label>
            <select
              className="form-select"
              value={selectedMasterId}
              onChange={(e) => setSelectedMasterId(e.target.value ? Number(e.target.value) : '')}
              required
            >
              <option value="">Выберите мастера</option>
              {masters.map((master) => (
                <option key={master.id} value={master.id}>
                  {master.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Дата *</label>
          <input
            type="date"
            className="form-input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={getMinDate()}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Время *</label>
          <div className="time-slots">
            {timeSlots.map((slot) => (
              <button
                key={slot}
                type="button"
                className={`time-slot ${selectedTime === slot ? 'selected' : ''}`}
                onClick={() => setSelectedTime(slot)}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Ваше имя</label>
          <input
            type="text"
            className="form-input"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Введите ваше имя"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Телефон</label>
          <input
            type="tel"
            className="form-input"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            placeholder="+7 (999) 999-99-99"
          />
        </div>

        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Создание...' : 'Создать запись'}
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate('/my-booking')}
        >
          Отмена
        </button>
      </form>
    </div>
  )
}

export default CreateBooking


import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { initData, mainButton, popup } from '@tma.js/sdk-react';
import {
  Section,
  Cell,
  List,
  Title,
  Spinner,
  Input,
  Button,
} from '@telegram-apps/telegram-ui';

import { Page } from '@/components/Page';
import { api } from '@/utils/api';
import { generateTimeSlots, getMinDate, getMaxDate } from '@/utils/timeSlots';
import type { Service, Master, TimeSlot } from '@/types';

import './BookingNew.css';

export function BookingNew() {
  const navigate = useNavigate();
  
  // Данные пользователя
  const [userId, setUserId] = useState<number | null>(null);
  
  // Шаги формы
  const [step, setStep] = useState<'service' | 'master' | 'datetime' | 'contact'>('service');
  
  // Данные для выбора
  const [services, setServices] = useState<Service[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  
  // Выбранные значения
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedMaster, setSelectedMaster] = useState<Master | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  
  // Состояния загрузки
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Инициализация пользователя и загрузка услуг
  useEffect(() => {
    const init = async () => {
      try {
        const tgUser = initData.user();
        
        if (!tgUser) {
          throw new Error('Telegram user data not available');
        }

        
        const userData = await api.getOrCreateUser(
          tgUser.id,
          tgUser.username,
          `${tgUser.first_name || ''} ${tgUser.last_name || ''}`.trim()
        );
        
        setUserId(userData.id);
        setClientName(userData.full_name || userData.username || '');
        setClientPhone(userData.phone || '');
        
        // Загружаем список услуг
        const servicesData = await api.getServices();
        setServices(servicesData.filter(s => s.is_active));
      } catch (err) {
        console.error('Failed to initialize:', err);
        popup.showFp({
          title: 'Ошибка',
          message: 'Не удалось загрузить данные',
          buttons: [{ id: 'ok', type: 'ok' }],
        });
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // Загрузка мастеров при выборе услуги
  useEffect(() => {
    if (selectedService) {
      const loadMasters = async () => {
        try {
          const mastersData = await api.getMastersByService(selectedService.id);
          setMasters(mastersData.filter(m => m.is_active));
        } catch (err) {
          console.error('Failed to load masters:', err);
          popup.showFp({
            title: 'Ошибка',
            message: 'Не удалось загрузить список мастеров',
            buttons: [{ id: 'ok', type: 'ok' }],
          });
        }
      };
      loadMasters();
    }
  }, [selectedService]);

  // Загрузка временных слотов при выборе даты и мастера
  useEffect(() => {
    if (selectedMaster && selectedDate) {
      const loadTimeSlots = async () => {
        try {
          const bookedTimes = await api.getBookedSlots(selectedMaster.id, selectedDate);
          const slots = generateTimeSlots(9, 21, 30, bookedTimes);
          setTimeSlots(slots);
        } catch (err) {
          console.error('Failed to load time slots:', err);
          setTimeSlots(generateTimeSlots(9, 21, 30, []));
        }
      };
      loadTimeSlots();
    }
  }, [selectedMaster, selectedDate]);

  // Настройка MainButton в зависимости от шага
  useEffect(() => {
    const canProceed = Boolean(
      (step === 'service' && selectedService) ||
      (step === 'master' && selectedMaster) ||
      (step === 'datetime' && selectedDate && selectedTime) ||
      (step === 'contact' && clientName && clientPhone)
    );

    mainButton.setParams({
      text: step === 'contact' ? 'Подтвердить запись' : 'Далее',
      isVisible: true,
      isEnabled: canProceed && !submitting,
    });

    const handleClick = async () => {
      if (step === 'service' && selectedService) {
        setStep('master');
      } else if (step === 'master' && selectedMaster) {
        setStep('datetime');
      } else if (step === 'datetime' && selectedDate && selectedTime) {
        setStep('contact');
      } else if (step === 'contact' && userId && selectedService && selectedMaster) {
        await handleSubmit();
      }
    };

    const unsubscribe = mainButton.onClick(handleClick);

    return () => {
      unsubscribe();
    };
  }, [step, selectedService, selectedMaster, selectedDate, selectedTime, clientName, clientPhone, userId, submitting]);

  const handleSubmit = async () => {
    if (!userId || !selectedService || !selectedMaster || !selectedDate || !selectedTime || !clientName || !clientPhone) {
      return;
    }

    setSubmitting(true);

    try {
      await api.createBooking({
        user_id: userId,
        service_id: selectedService.id,
        master_id: selectedMaster.id,
        date: selectedDate,
        time: selectedTime,
        client_name: clientName,
        client_phone: clientPhone,
      });

      popup.showFp({
        title: 'Успешно!',
        message: 'Запись успешно создана',
        buttons: [{ id: 'ok', type: 'ok' }],
      })
    } catch (err) {
      console.error('Failed to create booking:', err);
      popup.showFp({
        title: 'Ошибка',
        message: err instanceof Error ? err.message : 'Не удалось создать запись',
        buttons: [{ id: 'ok', type: 'ok' }],
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Page back>
        <div className="spinner-container">
          <Spinner size="l" />
        </div>
      </Page>
    );
  }

  return (
    <Page back>
      <div className="booking-new">
        <Section>
          <Title weight="1" level="2">
            {step === 'service' && 'Выберите услугу'}
            {step === 'master' && 'Выберите мастера'}
            {step === 'datetime' && 'Выберите дату и время'}
            {step === 'contact' && 'Контактные данные'}
          </Title>
        </Section>

        {step === 'service' && (
          <Section>
            <List>
              {services.map((service) => (
                <Cell
                  key={service.id}
                  onClick={() => setSelectedService(service)}
                  subtitle={`${service.duration} мин • ${service.price} ₽`}
                  description={service.description}
                  after={selectedService?.id === service.id ? '✓' : ''}
                  className={selectedService?.id === service.id ? 'selected' : ''}
                >
                  {service.name}
                </Cell>
              ))}
            </List>
          </Section>
        )}

        {step === 'master' && (
          <Section>
            <List>
              {masters.map((master) => (
                <Cell
                  key={master.id}
                  onClick={() => setSelectedMaster(master)}
                  subtitle={master.phone}
                  description={master.description}
                  after={selectedMaster?.id === master.id ? '✓' : ''}
                  className={selectedMaster?.id === master.id ? 'selected' : ''}
                >
                  {master.name}
                </Cell>
              ))}
            </List>
          </Section>
        )}

        {step === 'datetime' && (
          <Section>
            <div className="datetime-section">
              <div className="date-picker">
                <label htmlFor="date">Дата:</label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={getMinDate()}
                  max={getMaxDate()}
                />
              </div>

              {selectedDate && timeSlots.length > 0 && (
                <div className="time-slots">
                  <label>Время:</label>
                  <div className="time-grid">
                    {timeSlots.map((slot) => (
                      <Button
                        key={slot.time}
                        mode={selectedTime === slot.time ? 'filled' : 'outline'}
                        size="s"
                        disabled={!slot.available}
                        onClick={() => setSelectedTime(slot.time)}
                        className={`time-slot ${!slot.available ? 'disabled' : ''}`}
                      >
                        {slot.time}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>
        )}

        {step === 'contact' && (
          <Section>
            <div className="contact-section">
              <Input
                header="Имя"
                placeholder="Введите ваше имя"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
              <Input
                header="Телефон"
                placeholder="+7 (999) 123-45-67"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                type="tel"
              />

              <div className="booking-summary">
                <Title level="3">Итого:</Title>
                <div className="summary-item">
                  <span>Услуга:</span>
                  <span>{selectedService?.name}</span>
                </div>
                <div className="summary-item">
                  <span>Мастер:</span>
                  <span>{selectedMaster?.name}</span>
                </div>
                <div className="summary-item">
                  <span>Дата:</span>
                  <span>{new Date(selectedDate).toLocaleDateString('ru-RU')}</span>
                </div>
                <div className="summary-item">
                  <span>Время:</span>
                  <span>{selectedTime}</span>
                </div>
                <div className="summary-item summary-total">
                  <span>Стоимость:</span>
                  <span>{selectedService?.price} ₽</span>
                </div>
              </div>
            </div>
          </Section>
        )}
      </div>
    </Page>
  );
}


import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { initData, popup } from '@tma.js/sdk-react';
import {
  Section,
  Cell,
  List,
  Title,
  Spinner,
  Button,
  Text,
} from '@telegram-apps/telegram-ui';

import { Page } from '@/components/Page';
import { api } from '@/utils/api';
import { formatDate } from '@/utils/timeSlots';
import type { Booking } from '@/types';

import './BookingDetail.css';

export function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [telegramId, setTelegramId] = useState<number | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const tgUser = initData.user();
        
        if (!tgUser) {
          throw new Error('Telegram user data not available');
        }

        setTelegramId(tgUser.id);

        if (!id) {
          throw new Error('Booking ID not provided');
        }

        const bookingData = await api.getBooking(parseInt(id));
        setBooking(bookingData);
      } catch (err) {
        console.error('Failed to load booking:', err);
        popup.show({
          title: 'Ошибка',
          message: 'Не удалось загрузить данные о записи',
          buttons: [{ id: 'ok', type: 'ok' }],
        }).then(() => {
          navigate('/');
        });
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!booking || !telegramId) return;

    const result = await popup.show({
      title: 'Подтверждение',
      message: 'Вы уверены, что хотите отменить эту запись?',
      buttons: [
        { id: 'cancel', type: 'cancel'},
        { id: 'confirm', type: 'destructive', text: 'Да, отменить' },
      ],
    });

    if (result !== 'confirm') return;

    setDeleting(true);

    try {
      await api.deleteBooking(booking.id, telegramId);
      
      popup.show({
        title: 'Успешно!',
        message: 'Запись успешно отменена',
        buttons: [{ id: 'ok', type: 'ok' }],
      }).then(() => {
        navigate('/');
      });
    } catch (err) {
      console.error('Failed to delete booking:', err);
      popup.show({
        title: 'Ошибка',
        message: err instanceof Error ? err.message : 'Не удалось отменить запись',
        buttons: [{ id: 'ok', type: 'ok' }],
      });
    } finally {
      setDeleting(false);
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

  if (!booking) {
    return null;
  }

  const canCancel = booking.status !== 'cancelled' && booking.status !== 'completed';

  return (
    <Page back>
      <div className="booking-detail">
        <Section>
          <Title weight="1" level="2">Запись #{booking.id}</Title>
          <Text weight="3">Статус: {getStatusText(booking.status)}</Text>
        </Section>

        <Section>
          <List>
            <Cell
              subtitle="Услуга"
              description={booking.service?.description}
            >
              {booking.service?.name || 'Не указана'}
            </Cell>
            
            <Cell
              subtitle="Мастер"
              description={booking.master?.phone}
            >
              {booking.master?.name || 'Не указан'}
            </Cell>
            
            <Cell subtitle="Дата">
              {formatDate(booking.date)}
            </Cell>
            
            <Cell subtitle="Время">
              {booking.time}
            </Cell>
            
            <Cell subtitle="Длительность">
              {booking.service?.duration || 0} минут
            </Cell>
            
            <Cell subtitle="Стоимость">
              {booking.service?.price || 0} ₽
            </Cell>
            
            <Cell subtitle="Контактное имя">
              {booking.client_name}
            </Cell>
            
            <Cell subtitle="Контактный телефон">
              {booking.client_phone}
            </Cell>
          </List>
        </Section>

        {canCancel && (
          <Section>
            <div className="actions">
              <Button
                mode="bezeled"
                size="l"
                stretched
                onClick={handleDelete}
                loading={deleting}
              >
                Отменить запись
              </Button>
            </div>
          </Section>
        )}
      </div>
    </Page>
  );
}

function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'Ожидает подтверждения',
    confirmed: 'Подтверждено',
    cancelled: 'Отменено',
    completed: 'Завершено',
  };
  return statusMap[status] || status;
}


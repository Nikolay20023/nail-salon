
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { initData, mainButton } from '@tma.js/sdk-react';
import { 
  Section, 
  Cell, 
  List, 
  Text, 
  Title,
  Spinner,
  Placeholder 
} from '@telegram-apps/telegram-ui';

import { Page } from '@/components/Page';
import { api } from '@/utils/api';
import { isPastDateTime, formatDate } from '@/utils/timeSlots';
import type { Booking, User } from '@/types';

import './IndexPage.css';
import { AnimatedSticker } from '@/components/AnimatedSticker/AnimatedSticker';

export function IndexPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const initUser = async () => {
      try {
        const tgUser = initData.user();
        
        if (!tgUser) {
          throw new Error('Telegram user data not available');
        }

        // Создаем или получаем пользователя
        // @ts-ignore - Telegram SDK types might vary
        const firstName = tgUser.firstName || tgUser.first_name || '';
        // @ts-ignore - Telegram SDK types might vary  
        const lastName = tgUser.lastName || tgUser.last_name || '';
        const fullName = [firstName, lastName]
          .filter(Boolean)
          .join(' ') || tgUser.username || 'Пользователь';
        
        const userData = await api.getOrCreateUser(
          tgUser.id,
          tgUser.username,
          fullName
        );
        
        setUser(userData);
        
        // Загружаем бронирования пользователя
        const userBookings = await api.getUserBookings(tgUser.id);
        
        // Фильтруем только будущие бронирования
        const futureBookings = userBookings.filter(
          booking => !isPastDateTime(booking.date, booking.time)
        );
        
        setBookings(futureBookings);
      } catch (err) {
        console.error('Failed to initialize user:', err);
        setError(err instanceof Error ? err.message : 'Не удалось загрузить данные');
      } finally {
        setLoading(false);
      }
    };

    initUser();
  }, []);

  useEffect(() => {
    // Настройка MainButton для создания нового бронирования
    mainButton.setParams({
      text: 'Создать запись',
      isVisible: true,
      isEnabled: true,
    });

    const handleClick = () => {
      navigate('/booking/new');
    };

    const unsubscribe = mainButton.onClick(handleClick);

      return () => {
      unsubscribe();
        mainButton.hide();
      };
  }, [navigate]);

  if (loading) {
    return (
      <Page back={false}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}>
          <Spinner size="l" />
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page back={false}>
        <Placeholder
          header="Ошибка"
          description={error}
        >
          <AnimatedSticker emoji="🦆" animationType="wave" size={64} />
        </Placeholder>
      </Page>
    );
  }

  return (
    <Page back={false}>
      <div className="index-page">
        <Section>
          <Title weight="1" level="1">Мои записи</Title>
          {user && (
            <Text weight="3">
              Привет, {user.full_name || user.username || 'пользователь'}!
            </Text>
          )}
        </Section>

        {bookings.length === 0 ? (
          <Placeholder
            header="Нет активных записей"
            description="Нажмите кнопку ниже, чтобы создать новую запись"
          >
            <AnimatedSticker emoji="🦆" animationType="wave" size={64} />
          </Placeholder>
        ) : (
          <Section>
            <List>
              {bookings.map((booking) => (
                <Cell
                  key={booking.id}
                  onClick={() => navigate(`/booking/${booking.id}`)}
                  subtitle={`${formatDate(booking.date)} в ${booking.time}`}
                  description={
                    <>
                      <div>Мастер: {booking.master?.name || 'Не указан'}</div>
                      <div>Услуга: {booking.service?.name || 'Не указана'}</div>
                      <div>Статус: {getStatusText(booking.status)}</div>
                    </>
                  }
                >
                  <span className="booking-title">
                    Запись #{booking.id}
                  </span>
                </Cell>
              ))}
            </List>
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

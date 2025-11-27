import type { TimeSlot } from '@/types';

/**
 * Генерирует временные слоты для бронирования
 * @param startHour - Начальный час (по умолчанию 9)
 * @param endHour - Конечный час (по умолчанию 21)
 * @param interval - Интервал в минутах (по умолчанию 30)
 * @param bookedTimes - Массив занятых времен в формате "HH:MM"
 * @returns Массив временных слотов с информацией о доступности
 */
export function generateTimeSlots(
  startHour: number = 9,
  endHour: number = 21,
  interval: number = 30,
  bookedTimes: string[] = []
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += interval) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push({
        time,
        available: !bookedTimes.includes(time),
      });
    }
  }
  
  return slots;
}

/**
 * Проверяет, прошла ли указанная дата и время
 */
export function isPastDateTime(date: string, time: string): boolean {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  
  const bookingDate = new Date(year, month - 1, day, hours, minutes);
  const now = new Date();
  
  return bookingDate < now;
}

/**
 * Форматирует дату в читаемый формат
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const months = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
  ];
  
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Получает минимальную дату для бронирования (сегодня)
 */
export function getMinDate(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * Получает максимальную дату для бронирования (через 3 месяца)
 */
export function getMaxDate(): string {
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);
  return maxDate.toISOString().split('T')[0];
}


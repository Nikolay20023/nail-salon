import type { Booking, BookingCreate, Master, MasterCreate, Service, User } from '@/types';

// Получаем API URL из переменных окружения
// Если не указан - используем текущий домен (для production)
// В development - используем localhost:8000
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? 'http://localhost:8000' : '');

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Пользователи
  async getOrCreateUser(telegramId: number, username?: string, fullName?: string): Promise<User> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify({
        telegram_id: telegramId,
        username,
        full_name: fullName,
      }),
    });
  }

  // Услуги
  async getServices(): Promise<Service[]> {
    return this.request<Service[]>('/services');
  }

  async getService(id: number): Promise<Service> {
    return this.request<Service>(`/services/${id}`);
  }

  async createMaster(data: MasterCreate): Promise<Master> {
    return this.request<Master>('/masters', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Мастера
  async getMasters(): Promise<Master[]> {
    return this.request<Master[]>('/masters');
  }

  async getMaster(id: number): Promise<Master> {
    return this.request<Master>(`/masters/${id}`);
  }

  async getMastersByService(serviceId: number): Promise<Master[]> {
    return this.request<Master[]>(`/masters/by-service/${serviceId}`);
  }

  // Бронирования
  async getUserBookings(telegramId: number): Promise<Booking[]> {
    return this.request<Booking[]>(`/bookings/${telegramId}`);
  }

  async getBooking(bookingId: number): Promise<Booking> {
    return this.request<Booking>(`/booking/${bookingId}`);
  }

  async createBooking(data: BookingCreate): Promise<Booking> {
    return this.request<Booking>('/booking', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBooking(bookingId: number, data: Partial<BookingCreate>): Promise<Booking> {
    return this.request<Booking>(`/booking/${bookingId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBooking(bookingId: number, telegramId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/booking/${bookingId}?telegram_id=${telegramId}`, {
      method: 'DELETE',
    });
  }

  // Получить занятые слоты для мастера на дату
  async getBookedSlots(masterId: number, date: string): Promise<string[]> {
    try {
      // Пытаемся получить бронирования мастера на конкретную дату
      // Если такого эндпоинта нет, просто возвращаем пустой массив
      const bookings = await this.request<Booking[]>(`/bookings/master/${masterId}?date=${date}`);
      return bookings.map(b => b.time);
    } catch (error) {
      console.warn('Failed to fetch booked slots, assuming all slots are available:', error);
      return [];
    }
  }
}

export const api = new ApiClient(API_BASE_URL);


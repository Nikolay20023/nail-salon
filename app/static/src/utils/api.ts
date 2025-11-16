const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface Booking {
  id: number
  date: string
  time: string
  service?: string
  master_full_name?: string
  master_id?: number
  service_id?: number
  client_name?: string
  client_phone?: string
  status?: string
}

export interface BookingCreate {
  user_id: number
  service_id?: number
  master_id?: number
  date: string
  time: string
  client_name?: string
  client_phone?: string
}

export interface Service {
  id: number
  name: string
  price: number
  duration_min: number
  description?: string
  is_active?: boolean
}

export interface Master {
  id: number
  name: string
  instagram?: string
  photo?: string
  description?: string
  is_active?: boolean
}

export const api = {
  async getBookings(telegramId: number): Promise<Booking[]> {
    const response = await fetch(`${API_BASE_URL}/bookings/${telegramId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch bookings')
    }
    const data = await response.json()
    return data.bookings || []
  },

  async getBooking(bookingId: number): Promise<Booking> {
    const response = await fetch(`${API_BASE_URL}/booking/${bookingId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch booking')
    }
    return response.json()
  },

  async createBooking(booking: BookingCreate): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(booking),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to create booking')
    }
    return response.json()
  },

  async updateBooking(bookingId: number, booking: BookingCreate): Promise<Booking> {
    const response = await fetch(`${API_BASE_URL}/booking/${bookingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(booking),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to update booking')
    }
    return response.json()
  },

  async deleteBooking(bookingId: number, telegramId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/booking/${bookingId}?telegram_id=${telegramId}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to delete booking')
    }
  },

  async getServices(): Promise<Service[]> {
    const response = await fetch(`${API_BASE_URL}/service`)
    if (!response.ok) {
      throw new Error('Failed to fetch services')
    }
    return response.json()
  },

  async getMasters(serviceId: number): Promise<Master[]> {
    const response = await fetch(`${API_BASE_URL}/masters/${serviceId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch masters')
    }
    return response.json()
  },

  // Admin API
  async checkAdmin(telegramId: number): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/stats?telegram_id=${telegramId}`)
      return response.ok
    } catch {
      return false
    }
  },

  async getAdminStats(telegramId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/admin/stats?telegram_id=${telegramId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch stats')
    }
    return response.json()
  },

  // Admin Users
  async getAdminUsers(telegramId: number): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/admin/users?telegram_id=${telegramId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch users')
    }
    return response.json()
  },

  async toggleUserAdmin(userId: number, telegramId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/toggle-admin?telegram_id=${telegramId}`, {
      method: 'PUT',
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to toggle admin')
    }
    return response.json()
  },

  // Admin Services
  async getAdminServices(telegramId: number): Promise<Service[]> {
    const response = await fetch(`${API_BASE_URL}/admin/services?telegram_id=${telegramId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch services')
    }
    return response.json()
  },

  async createAdminService(service: any, telegramId: number): Promise<Service> {
    const response = await fetch(`${API_BASE_URL}/admin/services?telegram_id=${telegramId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(service),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to create service')
    }
    return response.json()
  },

  async updateAdminService(serviceId: number, service: any, telegramId: number): Promise<Service> {
    const response = await fetch(`${API_BASE_URL}/admin/services/${serviceId}?telegram_id=${telegramId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(service),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to update service')
    }
    return response.json()
  },

  async deleteAdminService(serviceId: number, telegramId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/admin/services/${serviceId}?telegram_id=${telegramId}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to delete service')
    }
  },

  // Admin Masters
  async getAdminMasters(telegramId: number): Promise<Master[]> {
    const response = await fetch(`${API_BASE_URL}/admin/masters?telegram_id=${telegramId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch masters')
    }
    return response.json()
  },

  async createAdminMaster(master: any, telegramId: number): Promise<Master> {
    const response = await fetch(`${API_BASE_URL}/admin/masters?telegram_id=${telegramId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(master),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to create master')
    }
    return response.json()
  },

  async updateAdminMaster(masterId: number, master: any, telegramId: number): Promise<Master> {
    const response = await fetch(`${API_BASE_URL}/admin/masters/${masterId}?telegram_id=${telegramId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(master),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to update master')
    }
    return response.json()
  },

  async deleteAdminMaster(masterId: number, telegramId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/admin/masters/${masterId}?telegram_id=${telegramId}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to delete master')
    }
  },

  // Admin Bookings
  async getAdminBookings(telegramId: number): Promise<Booking[]> {
    const response = await fetch(`${API_BASE_URL}/admin/bookings?telegram_id=${telegramId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch bookings')
    }
    return response.json()
  },

  async updateBookingStatus(bookingId: number, status: string, telegramId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/admin/bookings/${bookingId}/status?status=${status}&telegram_id=${telegramId}`, {
      method: 'PUT',
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to update status')
    }
    return response.json()
  },

  async deleteAdminBooking(bookingId: number, telegramId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/admin/bookings/${bookingId}?telegram_id=${telegramId}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to delete booking')
    }
  },
}

export interface User {
  id: number
  telegram_id: number
  first_name?: string
  last_name?: string
  username?: string
  phone?: string
  is_admin?: boolean
}


export interface User {
  id: number;
  telegram_id: number;
  username?: string;
  full_name?: string;
  phone?: string;
  is_admin: boolean;
  created_at: string;
}

export interface Service {
  id: number;
  name: string;
  description?: string;
  duration: number; // в минутах
  price: number;
  is_active: boolean;
}

export interface Master {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  services: Service[];
}


export interface MasterCreate {
  name: string;
  description?: string;
  photo?: string;
  instagram?: string;
}

export interface Booking {
  id: number;
  user_id: number;
  master_id: number;
  service_id: number;
  date: string; // ISO date format YYYY-MM-DD
  time: string; // HH:MM
  client_name: string;
  client_phone: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  master?: Master;
  service?: Service;
  user?: User;
}

export interface BookingCreate {
  user_id: number;
  master_id: number;
  service_id: number;
  date: string;
  time: string;
  client_name: string;
  client_phone: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}


import type { ComponentType } from 'react';

import { IndexPage } from '@/pages/IndexPage/IndexPage';
import { BookingNew } from '@/pages/BookingNew/BookingNew';
import { BookingDetail } from '@/pages/BookingDetail/BookingDetail';
import { MasterWidget } from '@/pages/MasterWidget/MasterWidget';
import { MasterServices } from '@/pages/MasterServices/MasterServices';
import { MasterSchedule } from '@/pages/MasterSchedule/MasterSchedule';

interface Route {
  path: string;
  Component: ComponentType;
  title?: string;
  icon?: JSX.Element;
}

export const routes: Route[] = [
  { path: '/', Component: IndexPage, title: 'Главная' },
  { path: '/booking/new', Component: BookingNew, title: 'Новая запись' },
  { path: '/booking/:id', Component: BookingDetail, title: 'Детали записи' },
  { path: '/master/new', Component: MasterWidget, title: 'Новый мастер' },
  { path: '/master/:masterId', Component: MasterWidget, title: 'Редактировать мастера' },
  { path: '/master/:masterId/services', Component: MasterServices, title: 'Услуги мастера' },
  { path: '/master/:masterId/schedule', Component: MasterSchedule, title: 'Расписание мастера' },
];

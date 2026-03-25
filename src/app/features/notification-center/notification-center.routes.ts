import { Routes } from '@angular/router';

export const NOTIFICATION_CENTER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/notification-dashboard/notification-dashboard').then(m => m.NotificationDashboardComponent),
    title: 'Centro de Notificaciones'
  }
];

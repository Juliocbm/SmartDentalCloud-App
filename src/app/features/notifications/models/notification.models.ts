export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export const NOTIFICATION_TYPE_CONFIG: Record<string, { icon: string; class: string }> = {
  appointment: { icon: 'fa-calendar-check', class: 'notif-info' },
  payment: { icon: 'fa-money-bill', class: 'notif-success' },
  treatment: { icon: 'fa-tooth', class: 'notif-primary' },
  system: { icon: 'fa-bell', class: 'notif-warning' },
  alert: { icon: 'fa-exclamation-triangle', class: 'notif-error' }
};

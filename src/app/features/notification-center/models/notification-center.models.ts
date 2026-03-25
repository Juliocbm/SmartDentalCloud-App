// =============================================
// Notification Center — TypeScript Models
// =============================================

export interface NotificationQueueItem {
  id: string;
  channel: string;
  notificationType: string | null;
  status: string;
  priority: number;
  recipientPhone: string | null;
  recipientEmail: string | null;
  patientName: string | null;
  patientId: string | null;
  subject: string | null;
  templateName: string | null;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  errorMessage: string | null;
  retryCount: number;
  maxRetries: number;
}

export interface NotificationQueueDetail {
  id: string;
  channel: string;
  notificationType: string | null;
  status: string;
  priority: number;
  direction: string;
  provider: string;
  recipientPhone: string | null;
  recipientEmail: string | null;
  subject: string | null;
  messageBody: string;
  templateName: string | null;
  templateParameters: string | null;
  patientId: string | null;
  patientName: string | null;
  contextType: string | null;
  contextId: string | null;
  scheduledAt: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  createdAt: string;
  createdByName: string | null;
  errorMessage: string | null;
  errorDetails: string | null;
  retryCount: number;
  maxRetries: number;
  lastRetryAt: string | null;
  nextRetryAt: string | null;
  processingStartedAt: string | null;
  cancelledAt: string | null;
  cancelledByName: string | null;
  cancellationReason: string | null;
}

export interface NotificationStats {
  pending: number;
  sentToday: number;
  failed: number;
  successRate: number;
  byChannel: Record<string, number>;
  byType: Record<string, number>;
  trend: NotificationTrendItem[];
}

export interface NotificationTrendItem {
  date: string;
  sent: number;
  failed: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface CreateNotificationRequest {
  channel: string;
  patientId?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  subject?: string;
  messageBody: string;
  scheduledAt?: string;
  priority?: number;
  contextType?: string;
  contextId?: string;
}

// Status configuration for badges
export const NOTIFICATION_STATUS_CONFIG: Record<string, { label: string; cssClass: string; icon: string }> = {
  Queued: { label: 'En cola', cssClass: 'badge-info', icon: 'fa-clock' },
  Sending: { label: 'Enviando', cssClass: 'badge-info', icon: 'fa-spinner fa-spin' },
  Sent: { label: 'Enviado', cssClass: 'badge-success', icon: 'fa-check' },
  Delivered: { label: 'Entregado', cssClass: 'badge-success', icon: 'fa-check-double' },
  Read: { label: 'Leído', cssClass: 'badge-primary', icon: 'fa-eye' },
  Failed: { label: 'Fallido', cssClass: 'badge-error', icon: 'fa-times' },
  Cancelled: { label: 'Cancelado', cssClass: 'badge-warning', icon: 'fa-ban' },
};

export const CHANNEL_CONFIG: Record<string, { label: string; icon: string; cssClass: string }> = {
  WhatsApp: { label: 'WhatsApp', icon: 'fa-brands fa-whatsapp', cssClass: 'channel-whatsapp' },
  Email: { label: 'Email', icon: 'fa-solid fa-envelope', cssClass: 'channel-email' },
  SMS: { label: 'SMS', icon: 'fa-solid fa-comment-sms', cssClass: 'channel-sms' },
};

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  AppointmentReminder: 'Recordatorio de Cita',
  PostTreatment: 'Post-Tratamiento',
  Birthday: 'Cumpleaños',
  Custom: 'Personalizada',
  Manual: 'Manual',
};

export const PRIORITY_CONFIG: Record<number, { label: string; cssClass: string }> = {
  0: { label: 'Normal', cssClass: 'badge-neutral' },
  1: { label: 'Alta', cssClass: 'badge-warning' },
  2: { label: 'Urgente', cssClass: 'badge-error' },
};

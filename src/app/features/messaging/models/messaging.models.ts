export interface SendWhatsAppRequest {
  patientId: string;
  templateName: string;
  templateParams: Record<string, string>;
  customMessage?: string;
}

export interface SendWhatsAppResult {
  success: boolean;
  messageLogId: string;
  externalId: string | null;
  errorMessage: string | null;
}

export interface WhatsAppTemplate {
  name: string;
  displayName: string;
  category: string;
  parameters: string[];
  systemParameters: string[];
  preview: string;
}

export interface MessageLog {
  id: string;
  tenantId: string;
  patientId: string | null;
  patientName: string | null;
  channel: string;
  direction: string;
  provider: string;
  recipientPhone: string;
  templateName: string | null;
  messageBody: string;
  status: string;
  errorMessage: string | null;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  createdByName: string | null;
  contextType: string | null;
}

export interface MessageLogPaginated {
  items: MessageLog[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface ScheduleWhatsAppRequest {
  patientId: string;
  templateName: string;
  templateParams: Record<string, string>;
  sendAt: string;
  contextType?: string;
  contextId?: string;
}

export interface ScheduleWhatsAppResult {
  success: boolean;
  messageLogId: string;
  scheduledAt: string;
  errorMessage: string | null;
}

export interface WhatsAppTenantConfig {
  isEnabled: boolean;
  reminderHoursBefore: number;
  autoRemindersEnabled: boolean;
  customGreeting: string | null;
}

export const MESSAGE_STATUS_CONFIG: Record<string, { label: string; cssClass: string; icon: string }> = {
  Queued: { label: 'En cola', cssClass: 'badge-info', icon: 'fa-clock' },
  Sending: { label: 'Enviando', cssClass: 'badge-info', icon: 'fa-spinner fa-spin' },
  Sent: { label: 'Enviado', cssClass: 'badge-success', icon: 'fa-check' },
  Delivered: { label: 'Entregado', cssClass: 'badge-success', icon: 'fa-check-double' },
  Read: { label: 'Leído', cssClass: 'badge-primary', icon: 'fa-eye' },
  Failed: { label: 'Fallido', cssClass: 'badge-danger', icon: 'fa-times' },
  Cancelled: { label: 'Cancelado', cssClass: 'badge-warning', icon: 'fa-ban' },
};

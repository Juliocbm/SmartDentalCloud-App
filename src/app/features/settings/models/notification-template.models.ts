// =============================================
// Notification Templates — TypeScript Models
// =============================================

export interface NotificationTemplate {
  id: string;
  channel: 'Email' | 'SMS' | 'WhatsApp';
  notificationType: string;
  displayName: string;
  // Email / SMS — contenido almacenado en DB
  subject: string | null;
  bodyTemplate: string | null;      // plantilla con {{variables}}
  parameters: string[];             // variables requeridas por el usuario
  systemParameters: string[];       // auto-resueltas: patientName, clinicName, etc.
  // WhatsApp — referencia a Twilio (cacheada desde la API de Twilio)
  twilioTemplateName: string | null;
  cachedPreview: string | null;
  cachedParameters: string[] | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface CreateNotificationTemplateRequest {
  channel: 'Email' | 'SMS';    // WhatsApp se crea vía sincronización con Twilio
  notificationType: string;
  displayName: string;
  subject?: string;
  bodyTemplate: string;
  isDefault?: boolean;
}

export interface UpdateNotificationTemplateRequest {
  notificationType?: string;   // permitido en WhatsApp para mapear el tipo
  displayName?: string;
  subject?: string;
  bodyTemplate?: string;
  isDefault?: boolean;
}

export const NOTIFICATION_TEMPLATE_TYPES: { value: string; label: string }[] = [
  { value: 'AppointmentReminder', label: 'Recordatorio de Cita' },
  { value: 'PostTreatment',       label: 'Post-Tratamiento' },
  { value: 'Birthday',            label: 'Cumpleaños' },
  { value: 'Custom',              label: 'Personalizada' },
  { value: 'Manual',              label: 'Manual' },
];

export const TEMPLATE_SYSTEM_VARIABLES: { key: string; label: string }[] = [
  { key: '{{patientName}}',      label: 'Nombre del paciente' },
  { key: '{{clinicName}}',       label: 'Nombre de la clínica' },
  { key: '{{appointmentDate}}',  label: 'Fecha de cita' },
  { key: '{{appointmentTime}}',  label: 'Hora de cita' },
  { key: '{{doctorName}}',       label: 'Nombre del doctor' },
];

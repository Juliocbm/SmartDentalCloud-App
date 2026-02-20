/**
 * Interfaces para Sesiones de Tratamiento
 * Mirrors backend DTO: TreatmentSessionDto
 * API: /api/treatments/{treatmentId}/sessions
 */

export interface TreatmentSession {
  id: string;
  treatmentId: string;
  appointmentId?: string;
  appointmentDate?: Date;
  sessionNumber: number;
  date: Date;
  duration?: number;
  status: string;
  notes?: string;
  createdAt: Date;
  createdBy?: string;
  createdByName?: string;
}

export interface CreateSessionRequest {
  sessionNumber: number;
  date: string;
  appointmentId?: string;
  duration?: number;
  notes?: string;
}

export interface SessionStatusConfig {
  label: string;
  class: string;
  icon: string;
}

export const SESSION_STATUS_CONFIG: Record<string, SessionStatusConfig> = {
  Pending: { label: 'Pendiente', class: 'badge-warning', icon: 'fa-clock' },
  InProgress: { label: 'En Progreso', class: 'badge-info', icon: 'fa-play' },
  Completed: { label: 'Completada', class: 'badge-success', icon: 'fa-check-circle' },
  Cancelled: { label: 'Cancelada', class: 'badge-danger', icon: 'fa-times-circle' },
  Postponed: { label: 'Pospuesta', class: 'badge-neutral', icon: 'fa-calendar-xmark' }
};

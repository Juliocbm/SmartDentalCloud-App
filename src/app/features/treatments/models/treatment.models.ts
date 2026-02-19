/**
 * Interfaces y configuración del módulo de Tratamientos
 * Basado en TreatmentDto del backend
 */

export interface Treatment {
  id: string;
  patientId: string;
  patientName?: string;
  serviceId: string;
  serviceName?: string;
  serviceCost?: number;
  startDate: Date;
  endDate?: Date;
  // Campos dentales
  toothNumber?: string;
  surface?: string;
  quadrant?: number;
  isMultipleTooth: boolean;
  // Estado y contexto
  status: TreatmentStatus;
  duration?: number;
  appointmentId?: string;
  appointmentDate?: Date;
  treatmentPlanItemId?: string;
  treatmentType: string; // "Ad-hoc" | "Planned"
  notes?: string;
  // Auditoría
  createdAt: Date;
  updatedAt?: Date;
  createdBy?: string;
  createdByName?: string;
  updatedBy?: string;
  updatedByName?: string;
  // Info adicional
  materialsCount?: number;
  followUpsCount?: number;
}

export interface CreateTreatmentRequest {
  patientId: string;
  serviceId: string;
  startDate: string;
  endDate?: string;
  toothNumber?: string;
  surface?: string;
  quadrant?: number;
  isMultipleTooth: boolean;
  status?: string;
  duration?: number;
  appointmentId?: string;
  treatmentPlanItemId?: string;
  notes?: string;
}

export interface UpdateTreatmentRequest {
  id: string;
  patientId: string;
  serviceId: string;
  startDate: string;
  endDate?: string;
  toothNumber?: string;
  surface?: string;
  quadrant?: number;
  isMultipleTooth: boolean;
  status?: string;
  duration?: number;
  appointmentId?: string;
  treatmentPlanItemId?: string;
  notes?: string;
}

export enum TreatmentStatus {
  InProgress = 'InProgress',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
  OnHold = 'OnHold'
}

export interface TreatmentStatusConfig {
  label: string;
  class: string;
  icon: string;
}

export const TREATMENT_STATUS_CONFIG: Record<TreatmentStatus, TreatmentStatusConfig> = {
  [TreatmentStatus.InProgress]: {
    label: 'En Progreso',
    class: 'badge-info',
    icon: 'fa-spinner'
  },
  [TreatmentStatus.Completed]: {
    label: 'Completado',
    class: 'badge-success',
    icon: 'fa-check-circle'
  },
  [TreatmentStatus.Cancelled]: {
    label: 'Cancelado',
    class: 'badge-danger',
    icon: 'fa-times-circle'
  },
  [TreatmentStatus.OnHold]: {
    label: 'En Espera',
    class: 'badge-warning',
    icon: 'fa-pause-circle'
  }
};

export const SURFACE_OPTIONS = [
  { value: 'Mesial', label: 'Mesial (M)' },
  { value: 'Distal', label: 'Distal (D)' },
  { value: 'Oclusal', label: 'Oclusal (O)' },
  { value: 'Vestibular', label: 'Vestibular (V)' },
  { value: 'Lingual', label: 'Lingual (L)' },
  { value: 'Palatino', label: 'Palatino (P)' },
  { value: 'Incisal', label: 'Incisal (I)' }
];

export const QUADRANT_OPTIONS = [
  { value: 1, label: 'Q1 - Superior Derecho' },
  { value: 2, label: 'Q2 - Superior Izquierdo' },
  { value: 3, label: 'Q3 - Inferior Izquierdo' },
  { value: 4, label: 'Q4 - Inferior Derecho' }
];

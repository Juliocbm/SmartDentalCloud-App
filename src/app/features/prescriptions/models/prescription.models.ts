/**
 * Interfaces y configuración del módulo de Recetas Médicas
 * Mirrors backend DTOs: PrescriptionDto, PrescriptionItemDto, CreatePrescriptionItemDto
 */

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  appointmentId?: string;
  prescribedById: string;
  prescribedByName: string;
  issuedAt: Date;
  expiresAt?: Date;
  diagnosis?: string;
  notes?: string;
  status: string;
  items: PrescriptionItem[];
}

export interface PrescriptionItem {
  id: string;
  medicationName: string;
  activeIngredient?: string;
  presentation?: string;
  dosage: string;
  quantity: number;
  frequency: string;
  duration: string;
  route?: string;
  instructions?: string;
  displayOrder: number;
}

export interface CreatePrescriptionRequest {
  patientId: string;
  appointmentId?: string;
  consultationNoteId?: string;
  issuedAt: string;
  diagnosis?: string;
  notes?: string;
  items: CreatePrescriptionItemRequest[];
}

export interface CreatePrescriptionItemRequest {
  medicationName: string;
  activeIngredient?: string;
  presentation?: string;
  dosage: string;
  quantity: number;
  frequency: string;
  duration: string;
  route?: string;
  instructions?: string;
}

export enum PrescriptionStatus {
  Active = 'Active',
  Completed = 'Completed',
  Cancelled = 'Cancelled'
}

export interface PrescriptionStatusConfig {
  label: string;
  class: string;
  icon: string;
}

export const PRESCRIPTION_STATUS_CONFIG: Record<string, PrescriptionStatusConfig> = {
  [PrescriptionStatus.Active]: {
    label: 'Activa',
    class: 'badge-success',
    icon: 'fa-check-circle'
  },
  [PrescriptionStatus.Completed]: {
    label: 'Dispensada',
    class: 'badge-info',
    icon: 'fa-prescription-bottle-medical'
  },
  [PrescriptionStatus.Cancelled]: {
    label: 'Cancelada',
    class: 'badge-danger',
    icon: 'fa-times-circle'
  }
};

export const ROUTE_OPTIONS = [
  { value: 'Oral', label: 'Oral' },
  { value: 'Sublingual', label: 'Sublingual' },
  { value: 'Tópica', label: 'Tópica' },
  { value: 'Intramuscular', label: 'Intramuscular' },
  { value: 'Intravenosa', label: 'Intravenosa' },
  { value: 'Inhalatoria', label: 'Inhalatoria' },
  { value: 'Rectal', label: 'Rectal' },
  { value: 'Oftálmica', label: 'Oftálmica' },
  { value: 'Ótica', label: 'Ótica' }
];

export const FREQUENCY_OPTIONS = [
  { value: 'Cada 4 horas', label: 'Cada 4 horas' },
  { value: 'Cada 6 horas', label: 'Cada 6 horas' },
  { value: 'Cada 8 horas', label: 'Cada 8 horas' },
  { value: 'Cada 12 horas', label: 'Cada 12 horas' },
  { value: 'Cada 24 horas', label: 'Cada 24 horas' },
  { value: 'Cada 48 horas', label: 'Cada 48 horas' },
  { value: 'Una vez al día', label: 'Una vez al día' },
  { value: 'Dos veces al día', label: 'Dos veces al día' },
  { value: 'Tres veces al día', label: 'Tres veces al día' },
  { value: 'Antes de dormir', label: 'Antes de dormir' },
  { value: 'Según necesidad', label: 'Según necesidad' }
];

export const DURATION_OPTIONS = [
  { value: '3 días', label: '3 días' },
  { value: '5 días', label: '5 días' },
  { value: '7 días', label: '7 días' },
  { value: '10 días', label: '10 días' },
  { value: '14 días', label: '14 días' },
  { value: '21 días', label: '21 días' },
  { value: '30 días', label: '30 días' },
  { value: 'Indefinido', label: 'Indefinido' }
];

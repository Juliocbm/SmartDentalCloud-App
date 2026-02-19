/**
 * Interfaces y configuración del módulo de Servicios Dentales
 * Basado en ServiceDto del backend
 */

export interface DentalServiceItem {
  id: string;
  name: string;
  cost: number;
  durationMinutes?: number;
  description?: string;
  isActive: boolean;
  // Campos funcionales
  category?: string;
  requiresFollowUp: boolean;
  followUpDays?: number;
  requiresAnesthesia: boolean;
  isMultiSession: boolean;
  estimatedSessions?: number;
  notes?: string;
  // CFDI
  claveProdServ?: string;
  claveUnidad?: string;
  // Audit
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateServiceRequest {
  name: string;
  cost: number;
  durationMinutes?: number;
  description?: string;
  category?: string;
  requiresFollowUp: boolean;
  followUpDays?: number;
  requiresAnesthesia: boolean;
  isMultiSession: boolean;
  estimatedSessions?: number;
  notes?: string;
  claveProdServ?: string;
  claveUnidad?: string;
}

export interface UpdateServiceRequest {
  id: string;
  name: string;
  cost: number;
  durationMinutes?: number;
  description?: string;
  category?: string;
  isActive: boolean;
  requiresFollowUp: boolean;
  followUpDays?: number;
  requiresAnesthesia: boolean;
  isMultiSession: boolean;
  estimatedSessions?: number;
  notes?: string;
  claveProdServ?: string;
  claveUnidad?: string;
}

export const SERVICE_CATEGORIES = [
  { value: 'Preventiva', label: 'Preventiva' },
  { value: 'Restaurativa', label: 'Restaurativa' },
  { value: 'Endodoncia', label: 'Endodoncia' },
  { value: 'Periodoncia', label: 'Periodoncia' },
  { value: 'Ortodoncia', label: 'Ortodoncia' },
  { value: 'Cirugía', label: 'Cirugía Oral' },
  { value: 'Prótesis', label: 'Prótesis' },
  { value: 'Estética', label: 'Estética Dental' },
  { value: 'Diagnóstico', label: 'Diagnóstico' },
  { value: 'Otro', label: 'Otro' }
];

/**
 * Interfaces y configuración del módulo de Servicios Dentales
 * Basado en ServiceDto del backend
 */

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  servicesCount: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface PriceChange {
  changedAt: Date;
  changedBy: string;
  oldPrice: number;
  newPrice: number;
  difference: number;
  percentageChange: number;
}

export interface DentalServiceItem {
  id: string;
  name: string;
  cost: number;
  durationMinutes?: number;
  description?: string;
  isActive: boolean;
  // Campos funcionales
  code?: string;
  category?: string;
  categoryId?: string;
  categoryName?: string;
  taxType?: string;
  calendarColor?: string;
  requiresConsent: boolean;
  consentTemplateId?: string;
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
  code?: string;
  category?: string;
  categoryId?: string;
  taxType?: string;
  calendarColor?: string;
  requiresConsent?: boolean;
  consentTemplateId?: string;
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
  code?: string;
  category?: string;
  categoryId?: string;
  isActive: boolean;
  taxType?: string;
  calendarColor?: string;
  requiresConsent?: boolean;
  consentTemplateId?: string;
  requiresFollowUp: boolean;
  followUpDays?: number;
  requiresAnesthesia: boolean;
  isMultiSession: boolean;
  estimatedSessions?: number;
  notes?: string;
  claveProdServ?: string;
  claveUnidad?: string;
}

export interface TreatmentSummary {
  id: string;
  patientId: string;
  patientName: string;
  serviceName: string;
  startDate: Date;
  endDate?: Date;
  status: string;
  cost: number;
  toothNumber?: string;
}

export interface ServiceStatistics {
  totalTreatments: number;
  activeTreatments: number;
  completedTreatments: number;
  totalRevenue: number;
  lastUsed?: Date;
  firstUsed?: Date;
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

export const TAX_TYPES = [
  { value: 'IVA16', label: 'IVA 16%' },
  { value: 'IVA8', label: 'IVA 8%' },
  { value: 'IEPS', label: 'IEPS' },
  { value: 'Exento', label: 'Exento' }
];

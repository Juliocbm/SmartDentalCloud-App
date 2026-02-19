export interface Patient {
  id: string;
  
  // Datos Personales
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  age: number | null;
  gender: string | null;
  phoneNumber: string | null;
  email: string | null;
  address: string | null;
  
  // Historia Médica Básica
  bloodType: string | null;
  allergies: string | null;
  chronicDiseases: string | null;
  currentMedications: string | null;
  smokingStatus: string | null;
  notes: string | null;
  
  // Control
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface CreatePatientRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  phoneNumber: string | null;
  email: string | null;
}

export interface UpdatePatientRequest {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  phoneNumber: string | null;
  email: string | null;
}

export interface UpdateMedicalHistoryRequest {
  patientId: string;
  bloodType: string | null;
  allergies: string | null;
  chronicDiseases: string | null;
  currentMedications: string | null;
  smokingStatus: string | null;
  notes: string | null;
}

export interface UpdateTaxInfoRequest {
  patientId: string;
  taxId: string;
  legalName: string;
  fiscalAddress: string;
}

export interface PatientSearchFilters {
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  hasUpcomingAppointments?: boolean;
  hasPendingBalance?: boolean;
  isActive?: boolean;
}

export interface PatientSearchResult {
  id: string;
  name: string;
  email: string;
  phone: string;
}

// Re-exportado desde core/models para mantener compatibilidad
export type { PaginatedList } from '../../../core/models/pagination.models';

export enum Gender {
  Male = 'Masculino',
  Female = 'Femenino',
  Other = 'Otro'
}

export enum SmokingStatus {
  NonSmoker = 'No fumador',
  Smoker = 'Fumador',
  ExSmoker = 'Ex-fumador'
}

export enum BloodType {
  OPositive = 'O+',
  ONegative = 'O-',
  APositive = 'A+',
  ANegative = 'A-',
  BPositive = 'B+',
  BNegative = 'B-',
  ABPositive = 'AB+',
  ABNegative = 'AB-'
}

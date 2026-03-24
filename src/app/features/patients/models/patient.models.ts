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
  
  // Identificación Oficial (NOM-024-SSA3-2012 Apéndice B)
  curp: string | null;
  state: string | null;
  municipality: string | null;
  locality: string | null;
  zipCode: string | null;
  occupation: string | null;
  maritalStatus: string | null;
  
  // Contacto de Emergencia
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  
  // Historia Médica Básica
  bloodType: string | null;
  currentMedications: string | null;
  smokingStatus: string | null;
  notes: string | null;
  
  // Datos Fiscales
  taxId: string | null;
  legalName: string | null;
  fiscalAddress: string | null;
  regimenFiscal: string | null;
  postalCode: string | null;

  // Preferencias de comunicación
  whatsAppOptIn: boolean;

  // Control
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface CreatePatientRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  gender?: string | null;
  phoneNumber: string | null;
  email: string | null;
  address?: string | null;
  curp?: string | null;
  state?: string | null;
  municipality?: string | null;
  locality?: string | null;
  zipCode?: string | null;
  occupation?: string | null;
  maritalStatus?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
}

export interface UpdatePatientRequest {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  gender?: string | null;
  phoneNumber: string | null;
  email: string | null;
  address?: string | null;
  curp?: string | null;
  state?: string | null;
  municipality?: string | null;
  locality?: string | null;
  zipCode?: string | null;
  occupation?: string | null;
  maritalStatus?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
}

export interface UpdateMedicalHistoryRequest {
  patientId: string;
  bloodType: string | null;
  currentMedications: string | null;
  smokingStatus: string | null;
  notes: string | null;
}

export interface UpdateTaxInfoRequest {
  patientId: string;
  taxId: string;
  legalName: string;
  fiscalAddress: string;
  regimenFiscal?: string;
  postalCode?: string;
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
  OccasionalSmoker = 'Ocasional',
  ExSmoker = 'Ex-fumador'
}

export enum MaritalStatus {
  Single = 'Soltero/a',
  Married = 'Casado/a',
  Divorced = 'Divorciado/a',
  Widowed = 'Viudo/a',
  FreeUnion = 'Unión Libre'
}

export interface ChangeHistoryEntry {
  id: string;
  userId: string | null;
  userName: string;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValues: string | null;
  newValues: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export const PATIENT_ENTITY_TYPE_LABELS: Record<string, string> = {
  Patient: 'Paciente',
  PatientAllergy: 'Alergia',
  PatientProblem: 'Diagnóstico',
  InformedConsent: 'Consentimiento',
  SignInformedConsent: 'Firma Consentimiento',
  PatientMedicalHistory: 'Historia Médica',
  PatientTaxInfo: 'Datos Fiscales',
  Treatment: 'Tratamiento',
  Prescription: 'Receta',
  ConsultationNote: 'Nota de Consulta',
};

export const PATIENT_ENTITY_TYPE_ICONS: Record<string, string> = {
  Patient: 'fa-user',
  PatientAllergy: 'fa-shield-virus',
  PatientDiagnosis: 'fa-clipboard-list',
  InformedConsent: 'fa-file-signature',
  SignInformedConsent: 'fa-signature',
  PatientMedicalHistory: 'fa-notes-medical',
  PatientTaxInfo: 'fa-file-invoice',
  Treatment: 'fa-tooth',
  Prescription: 'fa-prescription',
  ConsultationNote: 'fa-stethoscope',
};

export const PATIENT_ENTITY_TYPE_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'Todos los cambios' },
  { value: 'Patient', label: 'Paciente' },
  { value: 'PatientAllergy', label: 'Alergias' },
  { value: 'PatientDiagnosis', label: 'Diagnósticos' },
  { value: 'InformedConsent', label: 'Consentimientos' },
  { value: 'Treatment', label: 'Tratamientos' },
  { value: 'Prescription', label: 'Recetas' },
  { value: 'ConsultationNote', label: 'Notas de Consulta' },
  { value: 'PatientMedicalHistory', label: 'Historia Médica' },
  { value: 'PatientTaxInfo', label: 'Datos Fiscales' },
];

export interface MergePatientsRequest {
  primaryPatientId: string;
  duplicatePatientId: string;
  mergeMedicalHistory: boolean;
  mergeFiscalData: boolean;
}

export interface MergeResultDto {
  appointmentsMerged: number;
  treatmentsMerged: number;
  notesMerged: number;
  prescriptionsMerged: number;
  allergiesMerged: number;
  consentsMerged: number;
  problemsMerged: number;
  invoicesMerged: number;
}

export interface ClinicalExportRequest {
  includeAllergies?: boolean;
  includeDiagnoses?: boolean;
  includeTreatments?: boolean;
  includePrescriptions?: boolean;
  includeConsents?: boolean;
  fromDate?: string;
  toDate?: string;
}

export interface PatientClinicalExportDto {
  clinicName: string;
  clues: string | null;
  clinicAddress: string | null;
  clinicPhone: string | null;
  clinicLogoUrl: string | null;
  patient: ClinicalExportPatientDto;
  allergies: ClinicalExportAllergyDto[];
  activeProblems: ClinicalExportProblemDto[];
  recentTreatments: ClinicalExportTreatmentDto[];
  recentPrescriptions: ClinicalExportPrescriptionDto[];
  recentNotes: ClinicalExportNoteDto[];
  generatedBy: string;
  professionalLicense: string | null;
  generatedAt: string;
}

export interface ClinicalExportPatientDto {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  gender: string | null;
  curp: string | null;
  phoneNumber: string | null;
  email: string | null;
  address: string | null;
  bloodType: string | null;
  currentMedications: string | null;
  smokingStatus: string | null;
}

export interface ClinicalExportAllergyDto {
  allergenType: string;
  allergenName: string;
  severity: string;
  reactionDescription: string | null;
  isActive: boolean;
}

export interface ClinicalExportProblemDto {
  description: string;
  cie10Code: string | null;
  status: string;
  onsetDate: string | null;
  resolvedDate: string | null;
}

export interface ClinicalExportTreatmentDto {
  serviceName: string;
  toothNumber: string | null;
  status: string;
  createdAt: string;
  doctorName: string | null;
}

export interface ClinicalExportPrescriptionDto {
  prescriptionDate: string;
  doctorName: string | null;
  items: ClinicalExportPrescriptionItemDto[];
}

export interface ClinicalExportPrescriptionItemDto {
  medicationName: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  instructions: string | null;
}

export interface ClinicalExportNoteDto {
  createdAt: string;
  createdByName: string | null;
  chiefComplaint: string | null;
  diagnosis: string | null;
  diagnosisCie10Code: string | null;
  treatmentPlan: string | null;
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

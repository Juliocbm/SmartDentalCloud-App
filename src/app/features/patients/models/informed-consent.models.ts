export interface InformedConsent {
  id: string;
  patientId: string;
  userId: string;
  consentType: string;
  title: string;
  content?: string;
  status: string;
  templateId: string | null;
  appointmentId: string | null;
  treatmentId: string | null;
  signedAt: string | null;
  signedByPatient: boolean;
  witnessName: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  revocationReason: string | null;
  createdAt: string;
}

export interface CreateInformedConsentRequest {
  userId?: string;
  consentType: string;
  title: string;
  content: string;
  templateId?: string;
  appointmentId?: string;
  treatmentId?: string;
  expiresAt?: string;
}

export interface SignConsentRequest {
  patientSignatureData?: string;
  witnessName?: string;
}

export interface RevokeConsentRequest {
  reason: string;
}

export const CONSENT_TYPES = [
  { value: 'GeneralTreatment', label: 'Tratamiento General' },
  { value: 'Surgery', label: 'Cirugía' },
  { value: 'Anesthesia', label: 'Anestesia' },
  { value: 'Radiology', label: 'Radiología' },
  { value: 'Orthodontics', label: 'Ortodoncia' },
  { value: 'Endodontics', label: 'Endodoncia' },
  { value: 'Other', label: 'Otro' }
];

export const CONSENT_STATUSES = [
  { value: 'Pending', label: 'Pendiente', class: 'badge-warning' },
  { value: 'Signed', label: 'Firmado', class: 'badge-success' },
  { value: 'Revoked', label: 'Revocado', class: 'badge-danger' },
  { value: 'Expired', label: 'Expirado', class: 'badge-secondary' }
];

export function getConsentTypeLabel(value: string): string {
  return CONSENT_TYPES.find(t => t.value === value)?.label ?? value;
}

export function getConsentStatusLabel(value: string): string {
  return CONSENT_STATUSES.find(s => s.value === value)?.label ?? value;
}

export function getConsentStatusClass(value: string): string {
  return CONSENT_STATUSES.find(s => s.value === value)?.class ?? 'badge-secondary';
}

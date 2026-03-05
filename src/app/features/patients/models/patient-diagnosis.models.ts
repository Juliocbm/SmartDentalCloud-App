export interface PatientDiagnosis {
  id: string;
  patientId: string;
  cie10Code: string | null;
  description: string;
  status: string;
  severity: string | null;
  onsetDate: string | null;
  resolvedDate: string | null;
  notes: string | null;
  appointmentId: string | null;
  linkedTreatmentsCount: number;
  linkedCompletedTreatmentsCount: number;
  createdAt: string;
}

export interface CreatePatientDiagnosisRequest {
  cie10Code?: string;
  description: string;
  onsetDate?: string;
  notes?: string;
  severity?: string;
  appointmentId?: string;
}

export interface ResolvePatientDiagnosisRequest {
  notes?: string;
}

export const DIAGNOSIS_STATUSES = [
  { value: 'Active', label: 'Activo', class: 'badge-danger' },
  { value: 'Resolved', label: 'Resuelto', class: 'badge-success' },
  { value: 'Inactive', label: 'Inactivo', class: 'badge-secondary' }
];

export function getDiagnosisStatusLabel(value: string): string {
  return DIAGNOSIS_STATUSES.find(s => s.value === value)?.label ?? value;
}

export function getDiagnosisStatusClass(value: string): string {
  return DIAGNOSIS_STATUSES.find(s => s.value === value)?.class ?? 'badge-secondary';
}

export const DIAGNOSIS_SEVERITIES = [
  { value: 'Mild', label: 'Leve', class: 'badge-info' },
  { value: 'Moderate', label: 'Moderado', class: 'badge-warning' },
  { value: 'Severe', label: 'Severo', class: 'badge-danger' },
  { value: 'Critical', label: 'Crítico', class: 'badge-danger' }
];

export function getDiagnosisSeverityLabel(value: string | null): string {
  if (!value) return '';
  return DIAGNOSIS_SEVERITIES.find(s => s.value === value)?.label ?? value;
}

export function getDiagnosisSeverityClass(value: string | null): string {
  if (!value) return '';
  return DIAGNOSIS_SEVERITIES.find(s => s.value === value)?.class ?? 'badge-secondary';
}

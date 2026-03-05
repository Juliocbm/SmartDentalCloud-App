export interface PatientProblem {
  id: string;
  patientId: string;
  cie10Code: string | null;
  description: string;
  status: string;
  onsetDate: string | null;
  resolvedDate: string | null;
  notes: string | null;
  appointmentId: string | null;
  linkedTreatmentsCount: number;
  createdAt: string;
}

export interface CreatePatientProblemRequest {
  cie10Code?: string;
  description: string;
  onsetDate?: string;
  notes?: string;
  appointmentId?: string;
}

export interface ResolvePatientProblemRequest {
  notes?: string;
}

export const PROBLEM_STATUSES = [
  { value: 'Active', label: 'Activo', class: 'badge-danger' },
  { value: 'Resolved', label: 'Resuelto', class: 'badge-success' },
  { value: 'Inactive', label: 'Inactivo', class: 'badge-secondary' }
];

export function getProblemStatusLabel(value: string): string {
  return PROBLEM_STATUSES.find(s => s.value === value)?.label ?? value;
}

export function getProblemStatusClass(value: string): string {
  return PROBLEM_STATUSES.find(s => s.value === value)?.class ?? 'badge-secondary';
}

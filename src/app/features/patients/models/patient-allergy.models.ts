export interface PatientAllergy {
  id: string;
  patientId: string;
  allergenType: string;
  allergenName: string;
  reactionDescription: string | null;
  severity: string;
  detectedAt: string | null;
  verifiedByProfessional: boolean;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreatePatientAllergyRequest {
  allergenType: string;
  allergenName: string;
  reactionDescription?: string;
  severity: string;
  detectedAt?: string;
  verifiedByProfessional: boolean;
  notes?: string;
}

export interface UpdatePatientAllergyRequest {
  id: string;
  allergenType: string;
  allergenName: string;
  reactionDescription?: string;
  severity: string;
  detectedAt?: string;
  verifiedByProfessional: boolean;
  notes?: string;
}

export interface AllergyAlert {
  id: string;
  allergenType: string;
  allergenName: string;
  severity: string;
  reactionDescription: string | null;
  verifiedByProfessional: boolean;
}

export const ALLERGEN_TYPES = [
  { value: 'Medication', label: 'Medicamento' },
  { value: 'Food', label: 'Alimento' },
  { value: 'Environmental', label: 'Ambiental' },
  { value: 'Latex', label: 'Látex' },
  { value: 'Other', label: 'Otro' }
];

export const ALLERGY_SEVERITIES = [
  { value: 'Mild', label: 'Leve' },
  { value: 'Moderate', label: 'Moderada' },
  { value: 'Severe', label: 'Severa' },
  { value: 'LifeThreatening', label: 'Riesgo vital' }
];

export function getAllergenTypeLabel(value: string): string {
  return ALLERGEN_TYPES.find(t => t.value === value)?.label ?? value;
}

export function getSeverityLabel(value: string): string {
  return ALLERGY_SEVERITIES.find(s => s.value === value)?.label ?? value;
}

export function getSeverityClass(value: string): string {
  switch (value) {
    case 'Mild': return 'badge-info';
    case 'Moderate': return 'badge-warning';
    case 'Severe': return 'badge-danger';
    case 'LifeThreatening': return 'badge-danger-dark';
    default: return 'badge-secondary';
  }
}

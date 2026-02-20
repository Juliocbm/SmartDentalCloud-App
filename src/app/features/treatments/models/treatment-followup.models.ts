/**
 * Interfaces para Seguimientos de Tratamiento
 * Mirrors backend DTO: TreatmentFollowUpDto
 * API: /api/treatments/{treatmentId}/followups
 */

export interface TreatmentFollowUp {
  id: string;
  treatmentId: string;
  date: Date;
  description?: string;
  createdAt: Date;
  createdBy?: string;
  createdByName?: string;
}

export interface CreateFollowUpRequest {
  date: string;
  description?: string;
}

export interface UpdateFollowUpRequest {
  id: string;
  treatmentId: string;
  date: string;
  description?: string;
}

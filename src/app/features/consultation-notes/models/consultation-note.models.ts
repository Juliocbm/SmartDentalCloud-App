// ============================================
// ConsultationNote Models
// Mirrors backend DTOs from SmartDentalCloud.Application.Common.DTOs
// Note: ConsultationNote is 1:1 with Appointment (only Completed ones)
// ============================================

export interface ConsultationNote {
  id: string;
  appointmentId: string;
  chiefComplaint?: string;
  clinicalFindings?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  notes?: string;
  createdAt: Date;
  createdBy: string;
  createdByName?: string;
}

export interface CreateConsultationNoteRequest {
  appointmentId: string;
  chiefComplaint?: string;
  clinicalFindings?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  notes?: string;
}

export interface UpdateConsultationNoteRequest {
  id: string;
  chiefComplaint?: string;
  clinicalFindings?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  notes?: string;
}

// Used in the list view: completed appointment + note status
export interface AppointmentWithNoteStatus {
  id: string;
  patientName: string;
  doctorName: string | null;
  startAt: Date;
  endAt: Date;
  reason: string;
  hasNote: boolean;
  noteId?: string;
}

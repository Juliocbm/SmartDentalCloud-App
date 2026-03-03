// ============================================
// Cephalometric Analysis Models
// Mirrors backend DTOs from SmartDentalCloud.Application.Common.DTOs
// ============================================

// --- Main DTOs ---

export interface CephalometricAnalysis {
  id: string;
  patientId: string;
  patientName: string;
  performedBy: string;
  performedByName: string;
  appointmentId: string | null;
  treatmentPlanId: string | null;
  examDate: string;
  status: CephalometricAnalysisStatus;
  notes: string | null;
  imageFileName: string | null;
  imageUrl: string | null;
  calibrationMmPerPx: number | null;
  calibrationKnownMm: number | null;
  enableSteiner: boolean;
  enableBjork: boolean;
  enableExtended: boolean;
  patientAge: string | null;
  patientSex: string | null;
  doctorName: string | null;
  clinicalSummary: string | null;
  signedBy: string | null;
  signedByName: string | null;
  signedAt: string | null;
  rowVersion: string | null;
  createdAt: string;
  updatedAt: string | null;
  landmarks: CephalometricLandmarkDto[];
  measurements: CephalometricMeasurementDto[];
}

export interface CephalometricAnalysisListItem {
  id: string;
  patientId: string;
  patientName: string;
  performedByName: string;
  examDate: string;
  status: CephalometricAnalysisStatus;
  enableSteiner: boolean;
  enableBjork: boolean;
  enableExtended: boolean;
  hasImage: boolean;
  patientAge: string | null;
  patientSex: string | null;
  signedByName: string | null;
  signedAt: string | null;
  createdAt: string;
}

export interface CephalometricLandmarkDto {
  id: string;
  landmarkKey: string;
  x: number;
  y: number;
}

export interface CephalometricMeasurementDto {
  id: string;
  measureKey: string;
  label: string;
  analysisGroup: string;
  value: number;
  units: string;
  normMean: number;
  normSD: number;
  zScore: number | null;
  interpretation: string | null;
}

// --- Status ---

export type CephalometricAnalysisStatus = 'Draft' | 'Completed' | 'Signed';

export const CEPH_STATUS_CONFIG: Record<CephalometricAnalysisStatus, { label: string; cssClass: string; icon: string }> = {
  Draft: { label: 'Borrador', cssClass: 'badge-warning', icon: 'fa-pen' },
  Completed: { label: 'Completado', cssClass: 'badge-info', icon: 'fa-check' },
  Signed: { label: 'Firmado', cssClass: 'badge-success', icon: 'fa-file-signature' }
};

// --- Request types ---

export interface CreateCephalometricAnalysisRequest {
  patientId: string;
  examDate: string;
  appointmentId?: string | null;
  treatmentPlanId?: string | null;
  notes?: string | null;
}

export interface SaveCephalometricAnalysisRequest {
  analysisId: string;
  rowVersion: string | null;
  imageBase64: string | null;
  calibrationMmPerPx: number | null;
  calibrationKnownMm: number | null;
  enableSteiner: boolean;
  enableBjork: boolean;
  enableExtended: boolean;
  patientAge: string | null;
  patientSex: string | null;
  doctorName: string | null;
  clinicalSummary: string | null;
  notes: string | null;
  landmarks: LandmarkInput[];
  measurements: MeasurementInput[];
}

export interface LandmarkInput {
  landmarkKey: string;
  x: number;
  y: number;
}

export interface MeasurementInput {
  measureKey: string;
  label: string;
  analysisGroup: string;
  value: number;
  units: string;
  normMean: number;
  normSD: number;
  zScore: number | null;
  interpretation: string | null;
}

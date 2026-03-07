import { DentalChartTooth } from './dental-chart.models';

// ── List Item (cards) ──

export interface OdontogramListItem {
  id: string;
  patientId: string;
  patientName: string;
  performedByName: string;
  examDate: string;
  status: OdontogramStatus;
  totalTeeth: number;
  healthyCount: number;
  treatedCount: number;
  decayedCount: number;
  missingCount: number;
  extractedCount: number;
  implantCount: number;
  signedByName: string | null;
  signedAt: string | null;
  createdAt: string;
}

// ── Status ──

export type OdontogramStatus = 'Draft' | 'Signed';

export const ODONTOGRAM_STATUS_CONFIG: Record<
  OdontogramStatus,
  { label: string; icon: string; cssClass: string }
> = {
  Draft: {
    label: 'Borrador',
    icon: 'fa-file-pen',
    cssClass: 'badge-warning',
  },
  Signed: {
    label: 'Firmado',
    icon: 'fa-file-signature',
    cssClass: 'badge-success',
  },
};

// ── Full Evaluation ──

export interface OdontogramEvaluation {
  id: string;
  patientId: string;
  patientName: string;
  performedBy: string;
  performedByName: string;
  examDate: string;
  status: OdontogramStatus;
  notes: string | null;
  totalTeeth: number;
  healthyCount: number;
  treatedCount: number;
  decayedCount: number;
  missingCount: number;
  extractedCount: number;
  implantCount: number;
  signedBy: string | null;
  signedByName: string | null;
  signedAt: string | null;
  rowVersion: string | null;
  createdAt: string;
  updatedAt: string | null;
  teeth: DentalChartTooth[];
  warning?: string | null;
}

// ── Comparison ──

export interface OdontogramComparison {
  baseline: OdontogramComparisonSummary;
  current: OdontogramComparisonSummary;
  toothChanges: OdontogramToothChange[];
  teethChanged: number;
  teethImproved: number;
  teethWorsened: number;
  overallTrend: 'Improving' | 'Stable' | 'Worsening';
}

export interface OdontogramComparisonSummary {
  id: string;
  examDate: string;
  status: string;
  healthyCount: number;
  treatedCount: number;
  decayedCount: number;
  missingCount: number;
  extractedCount: number;
  implantCount: number;
}

export interface OdontogramToothChange {
  toothNumber: string;
  previousStatus: string;
  currentStatus: string;
  conditionsAdded: string[];
  conditionsRemoved: string[];
  changed: boolean;
  trend: string;
}

// ── Requests ──

export interface CreateOdontogramRequest {
  patientId: string;
  examDate: string;
  notes?: string | null;
}

export interface SaveOdontogramTeethRequest {
  odontogramId: string;
  rowVersion: string | null;
  teeth: OdontogramToothInput[];
}

export interface OdontogramToothInput {
  toothNumber: string;
  toothType: string;
  status: string;
  conditions: string[];
  surfaceConditions: Record<string, string | null>;
  notes: string | null;
}

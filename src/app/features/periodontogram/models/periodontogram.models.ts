// ============================================
// Periodontogram Models
// Mirrors backend DTOs from SmartDentalCloud.Application.Common.DTOs
// ============================================

// --- Main DTOs ---

export interface Periodontogram {
  id: string;
  patientId: string;
  patientName: string;
  performedBy: string;
  performedByName: string;
  appointmentId: string | null;
  treatmentPlanId: string | null;
  examDate: string;
  status: PeriodontogramStatus;
  periodontalClassification: string | null;
  grade: string | null;
  riskLevel: string | null;
  notes: string | null;
  averageProbingDepth: number | null;
  averageCAL: number | null;
  bleedingPercentage: number | null;
  sitesOver4mm: number | null;
  sitesOver6mm: number | null;
  signedBy: string | null;
  signedByName: string | null;
  signedAt: string | null;
  rowVersion: string | null;
  createdAt: string;
  updatedAt: string | null;
  teeth: PeriodontogramTooth[];
  warning?: string;
}

export interface PeriodontogramListItem {
  id: string;
  patientId: string;
  patientName: string;
  performedByName: string;
  examDate: string;
  status: PeriodontogramStatus;
  periodontalClassification: string | null;
  grade: string | null;
  riskLevel: string | null;
  averageProbingDepth: number | null;
  bleedingPercentage: number | null;
  sitesOver4mm: number | null;
  signedByName: string | null;
  signedAt: string | null;
  createdAt: string;
}

export interface PeriodontogramTooth {
  id: string;
  toothNumber: string;
  mobility: number | null;
  furcation: number | null;
  isMissing: boolean;
  plaqueIndex: number | null;
  notes: string | null;
  siteMeasurements: PeriodontogramSiteMeasurement[];
}

export interface PeriodontogramSiteMeasurement {
  id: string;
  surface: string;
  site: string;
  probingDepth: number | null;
  gingivalMargin: number | null;
  clinicalAttachmentLevel: number | null;
  bleeding: boolean;
  suppuration: boolean;
}

// --- Statistics ---

export interface PeriodontogramStatistics {
  periodontogramId: string;
  examDate: string;
  averageProbingDepth: number | null;
  averageCAL: number | null;
  bleedingPercentage: number | null;
  totalSitesMeasured: number;
  sitesOver4mm: number;
  sitesOver6mm: number;
  sitesWithBleeding: number;
  sitesWithSuppuration: number;
  missingTeeth: number;
  upperRight: QuadrantStatistics | null;
  upperLeft: QuadrantStatistics | null;
  lowerLeft: QuadrantStatistics | null;
  lowerRight: QuadrantStatistics | null;
  classification: string | null;
  stage: string | null;
  grade: string | null;
  riskLevel: string | null;
  sitesPD0to3: number;
  sitesPD4to5: number;
  sitesPD6Plus: number;
}

export interface QuadrantStatistics {
  quadrant: string;
  averageProbingDepth: number | null;
  averageCAL: number | null;
  bleedingPercentage: number | null;
  sitesMeasured: number;
}

// --- Comparison ---

export interface PeriodontogramComparison {
  baseline: PeriodontogramComparisonSummary;
  current: PeriodontogramComparisonSummary;
  probingDepthChange: number | null;
  calChange: number | null;
  bleedingPercentageChange: number | null;
  sitesOver4mmChange: number | null;
  sitesOver6mmChange: number | null;
  toothComparisons: ToothComparison[];
  overallTrend: 'Improving' | 'Stable' | 'Worsening';
}

export interface PeriodontogramComparisonSummary {
  id: string;
  examDate: string;
  status: string;
  averageProbingDepth: number | null;
  averageCAL: number | null;
  bleedingPercentage: number | null;
  sitesOver4mm: number | null;
  sitesOver6mm: number | null;
  classification: string | null;
  grade: string | null;
}

export interface ToothComparison {
  toothNumber: string;
  probingDepthChange: number | null;
  calChange: number | null;
  bleedingImproved: boolean;
  mobilityChange: number | null;
  trend: 'Improving' | 'Stable' | 'Worsening';
}

// --- Requests ---

export interface CreatePeriodontogramRequest {
  patientId: string;
  examDate: string;
  appointmentId?: string | null;
  treatmentPlanId?: string | null;
  notes?: string | null;
}

export interface SaveMeasurementsRequest {
  periodontogramId: string;
  rowVersion: string | null;
  teeth: ToothMeasurementInput[];
}

export interface ToothMeasurementInput {
  toothNumber: string;
  mobility: number | null;
  furcation: number | null;
  isMissing: boolean;
  plaqueIndex: number | null;
  sites: SiteMeasurementInput[];
}

export interface SiteMeasurementInput {
  surface: string;
  site: string;
  probingDepth: number | null;
  gingivalMargin: number | null;
  bleeding: boolean;
  suppuration: boolean;
}

// --- Enums & Constants ---

export type PeriodontogramStatus = 'Draft' | 'Completed' | 'Signed';

export const PERIO_STATUS_CONFIG: Record<PeriodontogramStatus, { label: string; icon: string; cssClass: string }> = {
  Draft:     { label: 'Borrador',   icon: 'fa-file-pen',         cssClass: 'badge-warning' },
  Completed: { label: 'Completado', icon: 'fa-circle-check',     cssClass: 'badge-info' },
  Signed:    { label: 'Firmado',    icon: 'fa-file-signature',   cssClass: 'badge-success' }
};

export const RISK_LEVEL_CONFIG: Record<string, { label: string; cssClass: string }> = {
  Bajo:        { label: 'Bajo',        cssClass: 'badge-success' },
  Moderado:    { label: 'Moderado',    cssClass: 'badge-warning' },
  Alto:        { label: 'Alto',        cssClass: 'badge-error' },
  Desconocido: { label: 'Desconocido', cssClass: 'badge-neutral' }
};

// Surfaces for periodontal measurement (6 sites per tooth: 3 buccal + 3 lingual)
export const PERIO_SURFACES = ['Buccal', 'Lingual'] as const;
export const PERIO_SITES = ['Mesial', 'Central', 'Distal'] as const;

// Display helper for site measurements in grid
export interface PerioSiteDisplay {
  toothNumber: string;
  surface: string;
  site: string;
  probingDepth: number | null;
  gingivalMargin: number | null;
  cal: number | null;
  bleeding: boolean;
  suppuration: boolean;
}

// ============================================
// Editable Grid Data Model
// ============================================

/**
 * Editable site — mutable model for the measurement grid.
 * Each tooth has 6 editable sites (3 Buccal + 3 Lingual).
 */
export interface EditableSite {
  surface: string;   // 'Buccal' | 'Lingual'
  site: string;      // 'Mesial' | 'Central' | 'Distal'
  pd: number | null;
  gm: number | null;
  cal: number | null; // auto-calculated
  bleeding: boolean;
  suppuration: boolean;
}

/**
 * Editable tooth — mutable model for the measurement grid.
 */
export interface EditableTooth {
  toothNumber: string;
  isMissing: boolean;
  mobility: number | null;
  furcation: number | null;
  plaqueIndex: number | null;
  buccalSites: EditableSite[];  // [Mesial, Central, Distal]
  lingualSites: EditableSite[]; // [Mesial, Central, Distal]
}

// All 32 permanent teeth in FDI order for grid rendering
export const UPPER_TEETH_ORDER: string[] = [
  '18','17','16','15','14','13','12','11',
  '21','22','23','24','25','26','27','28'
];
export const LOWER_TEETH_ORDER: string[] = [
  '48','47','46','45','44','43','42','41',
  '31','32','33','34','35','36','37','38'
];

/**
 * Creates a fresh set of 6 empty sites for a tooth.
 */
function createEmptySites(toothNumber: string): { buccal: EditableSite[]; lingual: EditableSite[] } {
  const makeSite = (surface: string, site: string): EditableSite => ({
    surface, site, pd: null, gm: null, cal: null, bleeding: false, suppuration: false
  });
  return {
    buccal: [makeSite('Buccal', 'Mesial'), makeSite('Buccal', 'Central'), makeSite('Buccal', 'Distal')],
    lingual: [makeSite('Lingual', 'Mesial'), makeSite('Lingual', 'Central'), makeSite('Lingual', 'Distal')]
  };
}

/**
 * Initializes a full set of 32 editable teeth with empty sites.
 */
export function initializeEditableTeeth(): EditableTooth[] {
  const allTeeth = [...UPPER_TEETH_ORDER, ...LOWER_TEETH_ORDER];
  return allTeeth.map(tn => {
    const sites = createEmptySites(tn);
    return {
      toothNumber: tn,
      isMissing: false,
      mobility: null,
      furcation: null,
      plaqueIndex: null,
      buccalSites: sites.buccal,
      lingualSites: sites.lingual
    };
  });
}

/**
 * Converts API PeriodontogramTooth[] → EditableTooth[] for the grid.
 */
export function toEditableTeeth(apiTeeth: PeriodontogramTooth[]): EditableTooth[] {
  const base = initializeEditableTeeth();
  const apiMap = new Map(apiTeeth.map(t => [t.toothNumber, t]));

  for (const tooth of base) {
    const api = apiMap.get(tooth.toothNumber);
    if (!api) continue;

    tooth.isMissing = api.isMissing;
    tooth.mobility = api.mobility;
    tooth.furcation = api.furcation;
    tooth.plaqueIndex = api.plaqueIndex;

    for (const site of api.siteMeasurements) {
      const targetArr = site.surface === 'Buccal' ? tooth.buccalSites : tooth.lingualSites;
      const target = targetArr.find(s => s.site === site.site);
      if (target) {
        target.pd = site.probingDepth;
        target.gm = site.gingivalMargin;
        target.cal = site.clinicalAttachmentLevel;
        target.bleeding = site.bleeding;
        target.suppuration = site.suppuration;
      }
    }
  }
  return base;
}

/**
 * Converts EditableTooth[] → ToothMeasurementInput[] for the save API.
 */
export function toSavePayload(teeth: EditableTooth[]): ToothMeasurementInput[] {
  return teeth.map(t => ({
    toothNumber: t.toothNumber,
    mobility: t.mobility,
    furcation: t.furcation,
    isMissing: t.isMissing,
    plaqueIndex: t.plaqueIndex,
    sites: [...t.buccalSites, ...t.lingualSites].map(s => ({
      surface: s.surface === 'Buccal' ? 'Vestibular' : 'Lingual',
      site: s.site,
      probingDepth: s.pd,
      gingivalMargin: s.gm,
      bleeding: s.bleeding,
      suppuration: s.suppuration
    }))
  }));
}

/**
 * Calculate CAL from PD and GM values.
 */
export function calculateCAL(pd: number | null, gm: number | null): number | null {
  if (pd == null) return null;
  if (gm == null) return pd;
  if (gm > 0) return Math.max(0, pd - gm);
  return pd + Math.abs(gm);
}

/**
 * Convert EditableSite[] to PerioSiteDisplay[] for the SVG component.
 */
export function toSiteDisplays(toothNumber: string, sites: EditableSite[]): PerioSiteDisplay[] {
  return sites.map(s => ({
    toothNumber,
    surface: s.surface,
    site: s.site,
    probingDepth: s.pd,
    gingivalMargin: s.gm,
    cal: s.cal,
    bleeding: s.bleeding,
    suppuration: s.suppuration
  }));
}

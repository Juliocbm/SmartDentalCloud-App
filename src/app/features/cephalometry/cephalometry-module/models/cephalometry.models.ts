/**
 * Core types and interfaces for the Cephalometry module.
 */

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

export interface Point {
  x: number;
  y: number;
}

// ---------------------------------------------------------------------------
// Landmarks
// ---------------------------------------------------------------------------

export type LandmarkKey =
  | 'S' | 'N' | 'A' | 'B'
  | 'Po' | 'Or' | 'Go' | 'Me'
  | 'Pg' | 'Gn' | 'Ar'
  | 'U1T' | 'U1A' | 'L1T' | 'L1A'
  | 'Prn' | 'PgS' | 'Li'
  | 'Ba' | 'Pt' | 'Co'
  | 'Oc1' | 'Oc2';

export interface LandmarkDefinition {
  key: LandmarkKey;
  label: string;
  description: string;
}

export type LandmarkMap = Partial<Record<LandmarkKey, Point>>;

// ---------------------------------------------------------------------------
// Clinical norms
// ---------------------------------------------------------------------------

export interface NormRange {
  mean: number;
  sd: number;
}

export interface SteinerNorms {
  SNA: NormRange;
  SNB: NormRange;
  ANB: NormRange;
  SN_GoGn: NormRange;
  U1_NA_deg: NormRange;
  U1_NA_mm: NormRange;
  L1_NB_deg: NormRange;
  L1_NB_mm: NormRange;
  Interincisal: NormRange;
  Pg_NB_mm: NormRange;
}

export interface BjorkNorms {
  Saddle_NSAr: NormRange;
  Articular_SArGo: NormRange;
  Gonial_ArGoMe: NormRange;
  Sum_Bjork: NormRange;
  Jarabak_Ratio: NormRange;
}

export interface SoftTissueNorms {
  ELine_Li_mm: NormRange;
}

export interface ExtendedNorms {
  IMPA: NormRange;
  Wits: NormRange;
  Ocl_SN: NormRange;
  Facial_Angle: NormRange;
  U1_SN: NormRange;
}

export interface AllNorms {
  steiner: SteinerNorms;
  bjork: BjorkNorms;
  soft: SoftTissueNorms;
  extended: ExtendedNorms;
}

// ---------------------------------------------------------------------------
// Analysis results
// ---------------------------------------------------------------------------

export type Interpretation = 'normal' | 'mayor' | 'menor' | '—';

export interface MeasureResult {
  key: string;
  label: string;
  value: number;
  units: string;
  norm: NormRange;
  zScore: number;
  interpretation: Interpretation;
}

export interface SteinerResults {
  SNA: number;
  SNB: number;
  ANB: number;
  SN_GoGn: number;
  U1_NA_deg: number;
  U1_NA_mm: number;
  L1_NB_deg: number;
  L1_NB_mm: number;
  Interincisal: number;
  Pg_NB_mm: number;
}

export interface BjorkResults {
  Saddle_NSAr: number;
  Articular_SArGo: number;
  Gonial_ArGoMe: number;
  Sum_Bjork: number;
  Jarabak_Ratio: number;
}

export interface SoftTissueResults {
  ELine_Li_mm: number;
}

export interface ExtendedResults {
  IMPA: number;
  Wits: number;
  Ocl_SN: number;
  Facial_Angle: number;
  U1_SN: number;
}

export interface FullAnalysisResults {
  steiner: SteinerResults;
  bjork: BjorkResults;
  soft: SoftTissueResults;
  extended: ExtendedResults;
  measures: MeasureResult[];
  clinicalSummary: string;
}

// ---------------------------------------------------------------------------
// Patient data
// ---------------------------------------------------------------------------

export interface PatientData {
  name: string;
  age: string;
  sex: 'M' | 'F' | 'X';
  date: string;
  doctor: string;
}

// ---------------------------------------------------------------------------
// Calibration
// ---------------------------------------------------------------------------

export interface CalibrationData {
  point1: Point | null;
  point2: Point | null;
  knownMm: number;
  mmPerPx: number | null;
}

// ---------------------------------------------------------------------------
// Canvas / rendering
// ---------------------------------------------------------------------------

export interface LineStyle {
  color: string;
  width: number;
  dash?: number[];
}

export interface CephLineDefinition {
  from: LandmarkKey;
  to: LandmarkKey;
  style: LineStyle;
}

export interface CephArcDefinition {
  vertex: LandmarkKey;
  arm1: LandmarkKey;
  arm2: LandmarkKey;
  style: LineStyle;
  label?: string;
}

// ---------------------------------------------------------------------------
// Module config
// ---------------------------------------------------------------------------

export interface CephalometryConfig {
  enableSteiner: boolean;
  enableBjork: boolean;
  enableExtended: boolean;
  enableSoftTissue: boolean;
  showOverlay: boolean;
  norms?: Partial<AllNorms>;
}

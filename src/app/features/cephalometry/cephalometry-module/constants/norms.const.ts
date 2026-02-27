import { AllNorms } from '../models/cephalometry.models';

/**
 * Default clinical norms used for cephalometric analysis.
 * Values are mean ± SD from standard orthodontic references.
 */
export const DEFAULT_NORMS: AllNorms = {
  steiner: {
    SNA:          { mean: 82,  sd: 3 },
    SNB:          { mean: 80,  sd: 3 },
    ANB:          { mean: 2,   sd: 2 },
    SN_GoGn:      { mean: 32,  sd: 5 },
    U1_NA_deg:    { mean: 22,  sd: 6 },
    U1_NA_mm:     { mean: 4,   sd: 2 },
    L1_NB_deg:    { mean: 25,  sd: 6 },
    L1_NB_mm:     { mean: 4,   sd: 2 },
    Interincisal: { mean: 131, sd: 6 },
    Pg_NB_mm:     { mean: 0,   sd: 2 },
  },
  bjork: {
    Saddle_NSAr:     { mean: 123, sd: 5 },
    Articular_SArGo: { mean: 143, sd: 6 },
    Gonial_ArGoMe:   { mean: 130, sd: 7 },
    Sum_Bjork:       { mean: 396, sd: 6 },
    Jarabak_Ratio:   { mean: 65,  sd: 3 },
  },
  soft: {
    ELine_Li_mm: { mean: -2, sd: 2 },
  },
  extended: {
    IMPA:         { mean: 90,  sd: 5 },
    Wits:         { mean: 0,   sd: 1 },
    Ocl_SN:       { mean: 14,  sd: 4 },
    Facial_Angle: { mean: 87,  sd: 3 },
    U1_SN:        { mean: 104, sd: 5 },
  },
};

/**
 * Clinical tolerance for interpretation.
 * Values within mean ± tolerance are considered "normal".
 */
export const CLINICAL_TOLERANCES: Record<string, number> = {
  '°': 2,
  'mm': 1,
  '%': 2,
};

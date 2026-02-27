// ============================================
// Dental Chart (Odontogram) Models
// FDI Notation (ISO 3950)
// ============================================

export interface DentalChartTooth {
  id: string;
  toothNumber: string;
  toothType: 'Primary' | 'Permanent';
  status: ToothStatus;
  conditions: string[];
  surfaceConditions: Record<ToothSurface, string | null>;
  notes: string | null;
  updatedAt: string | null;
  updatedByName: string | null;
  totalChanges: number;
}

export interface DentalChartHistoryEntry {
  id: string;
  toothNumber: string;
  changeType: string;
  previousValue: string | null;
  newValue: string;
  description: string | null;
  changedAt: string;
  changedByName: string;
  treatmentId: string | null;
}

export interface UpdateToothRequest {
  status: ToothStatus;
  conditions: string[];
  surfaceConditions?: Record<string, string | null>;
  notes?: string | null;
  treatmentId?: string | null;
}

// ============================================
// Enums & Constants
// ============================================

export type ToothStatus =
  | 'Healthy'
  | 'Treated'
  | 'Decayed'
  | 'Missing'
  | 'Extracted'
  | 'Implant';

export type ToothSurface =
  | 'mesial'
  | 'distal'
  | 'occlusal'
  | 'buccal'
  | 'lingual';

export const TOOTH_SURFACES: ToothSurface[] = [
  'mesial',
  'distal',
  'occlusal',
  'buccal',
  'lingual'
];

export const SURFACE_LABELS: Record<ToothSurface, string> = {
  mesial: 'Mesial (M)',
  distal: 'Distal (D)',
  occlusal: 'Oclusal (O)',
  buccal: 'Vestibular (V)',
  lingual: 'Lingual/Palatino (L)'
};

export interface ToothStatusConfig {
  label: string;
  color: string;
  icon: string;
  bgClass: string;
}

export const TOOTH_STATUS_CONFIG: Record<ToothStatus, ToothStatusConfig> = {
  Healthy:   { label: 'Sano',      color: '#4CAF50', icon: 'fa-check-circle',       bgClass: 'status-healthy' },
  Treated:   { label: 'Tratado',   color: '#2196F3', icon: 'fa-circle-check',       bgClass: 'status-treated' },
  Decayed:   { label: 'Caries',    color: '#F44336', icon: 'fa-circle-exclamation',  bgClass: 'status-decayed' },
  Missing:   { label: 'Ausente',   color: '#9E9E9E', icon: 'fa-circle-minus',       bgClass: 'status-missing' },
  Extracted: { label: 'Extraído',  color: '#795548', icon: 'fa-circle-xmark',       bgClass: 'status-extracted' },
  Implant:   { label: 'Implante',  color: '#FF9800', icon: 'fa-gear',               bgClass: 'status-implant' }
};

// ── Condition Categories (inspired by DentalLink) ──

export const PREEXISTENCIAS: string[] = [
  'corona',
  'endodoncia',
  'sellante',
  'ortodoncia',
  'puente',
  'protesis',
  'perno'
];

export const LESIONES: string[] = [
  'caries',
  'fractura',
  'absceso',
  'gingivitis',
  'movilidad',
  'erosion',
  'residuo_radicular'
];

export const DENTAL_CONDITIONS: string[] = [
  ...PREEXISTENCIAS,
  ...LESIONES
];

export const CONDITION_LABELS: Record<string, string> = {
  corona: 'Corona',
  endodoncia: 'Endodoncia',
  sellante: 'Sellante',
  ortodoncia: 'Ortodoncia',
  puente: 'Puente',
  protesis: 'Prótesis removible',
  perno: 'Perno muñón',
  caries: 'Caries',
  fractura: 'Fractura',
  absceso: 'Absceso',
  gingivitis: 'Gingivitis',
  movilidad: 'Movilidad',
  erosion: 'Erosión',
  residuo_radicular: 'Residuo radicular'
};

export const PREEXISTENCIA_COLOR = '#1565C0';
export const LESION_COLOR = '#424242';

// ============================================
// Surface Condition Colors
// ============================================

export const SURFACE_CONDITION_COLORS: Record<string, string> = {
  caries:   '#F44336',
  resina:   '#2196F3',
  amalgama: '#607D8B',
  corona:   '#FF9800',
  sellante: '#8BC34A',
  fractura: '#9C27B0'
};

export const SURFACE_CONDITION_LABELS: Record<string, string> = {
  caries:   'Caries',
  resina:   'Resina',
  amalgama: 'Amalgama',
  corona:   'Corona',
  sellante: 'Sellante',
  fractura: 'Fractura'
};

// ============================================
// Tooth Anatomy — SVG Shape Data
// ============================================

export type ToothAnatomyType =
  | 'central-incisor'
  | 'lateral-incisor'
  | 'canine'
  | 'first-premolar'
  | 'second-premolar'
  | 'first-molar'
  | 'second-molar'
  | 'third-molar';

export interface ToothShape {
  crown: string;
  roots: string[];
}

export interface ToothAnatomyDef {
  upper: ToothShape;
  lower: ToothShape;
}

/**
 * Derives tooth anatomy type from FDI number (last digit).
 * Works for both permanent (1-4) and primary (5-8) quadrants.
 */
export function getToothAnatomyType(fdi: string): ToothAnatomyType {
  const lastDigit = fdi.charAt(fdi.length - 1);
  switch (lastDigit) {
    case '1': return 'central-incisor';
    case '2': return 'lateral-incisor';
    case '3': return 'canine';
    case '4': return 'first-premolar';
    case '5': return 'second-premolar';
    case '6': return 'first-molar';
    case '7': return 'second-molar';
    case '8': return 'third-molar';
    default:  return 'first-premolar';
  }
}

/**
 * Derives jaw position from FDI number (first digit).
 */
export function getToothJaw(fdi: string): 'upper' | 'lower' {
  const q = fdi.charAt(0);
  return (q === '1' || q === '2' || q === '5' || q === '6') ? 'upper' : 'lower';
}

/**
 * SVG shape definitions per tooth anatomy type.
 * ViewBox: "0 0 40 50" — upper: crown y=2..26, roots y=26..48
 *                         lower: roots y=2..24, crown y=24..48
 */
export const TOOTH_ANATOMY: Record<ToothAnatomyType, ToothAnatomyDef> = {
  // ── Incisors ────────────────────────────────
  'central-incisor': {
    upper: {
      crown: 'M8,26 L7,8 C7,3 11,1 20,1 C29,1 33,3 33,8 L32,26 Z',
      roots: ['M15,26 C15,26 17,43 20,47 C23,43 25,26 25,26']
    },
    lower: {
      crown: 'M12,24 L12,42 C12,47 16,49 20,49 C24,49 28,47 28,42 L28,24 Z',
      roots: ['M16,24 C16,24 18,7 20,3 C22,7 24,24 24,24']
    }
  },
  'lateral-incisor': {
    upper: {
      crown: 'M10,26 L9,9 C9,4 13,1 20,1 C27,1 31,4 31,9 L30,26 Z',
      roots: ['M16,26 C16,26 18,42 20,46 C22,42 24,26 24,26']
    },
    lower: {
      crown: 'M11,24 L11,42 C11,47 15,49 20,49 C25,49 29,47 29,42 L29,24 Z',
      roots: ['M16,24 C16,24 18,8 20,4 C22,8 24,24 24,24']
    }
  },
  // ── Canine ──────────────────────────────────
  'canine': {
    upper: {
      crown: 'M10,26 L9,13 C9,7 13,4 17,2 L20,0 L23,2 C27,4 31,7 31,13 L30,26 Z',
      roots: ['M15,26 C15,26 17,44 20,50 C23,44 25,26 25,26']
    },
    lower: {
      crown: 'M10,24 L10,37 C10,43 13,46 17,48 L20,50 L23,48 C27,46 30,43 30,37 L30,24 Z',
      roots: ['M15,24 C15,24 17,6 20,0 C23,6 25,24 25,24']
    }
  },
  // ── Premolars ───────────────────────────────
  'first-premolar': {
    upper: {
      crown: 'M8,26 L8,10 C8,5 11,2 15,1 L18,0 L20,2 L22,0 L25,1 C29,2 32,5 32,10 L32,26 Z',
      roots: [
        'M13,26 C13,26 11,38 13,44 C15,38 17,26 17,26',
        'M23,26 C23,26 25,38 27,44 C29,38 27,26 27,26'
      ]
    },
    lower: {
      crown: 'M8,24 L8,40 C8,45 11,48 15,49 L18,50 L20,48 L22,50 L25,49 C29,48 32,45 32,40 L32,24 Z',
      roots: ['M16,24 C16,24 18,8 20,3 C22,8 24,24 24,24']
    }
  },
  'second-premolar': {
    upper: {
      crown: 'M9,26 L8,10 C8,5 12,2 16,1 L18,0 L20,2 L22,0 L24,1 C28,2 32,5 32,10 L31,26 Z',
      roots: ['M16,26 C16,26 18,42 20,47 C22,42 24,26 24,26']
    },
    lower: {
      crown: 'M9,24 L9,40 C9,45 12,48 16,49 L18,50 L20,48 L22,50 L24,49 C28,48 31,45 31,40 L31,24 Z',
      roots: ['M16,24 C16,24 18,8 20,3 C22,8 24,24 24,24']
    }
  },
  // ── Molars ──────────────────────────────────
  'first-molar': {
    upper: {
      crown: 'M4,26 L4,9 C4,4 7,1 13,1 L16,0 L19,2 L21,0 L24,2 L27,1 C33,1 36,4 36,9 L36,26 Z',
      roots: [
        'M9,26 C9,26 7,38 9,44 C11,38 13,26 13,26',
        'M18,26 C18,26 19,37 20,42 C21,37 22,26 22,26',
        'M27,26 C27,26 29,38 31,44 C33,38 31,26 31,26'
      ]
    },
    lower: {
      crown: 'M4,24 L4,41 C4,46 7,49 13,49 L16,50 L19,48 L21,50 L24,48 L27,49 C33,49 36,46 36,41 L36,24 Z',
      roots: [
        'M10,24 C10,24 8,10 10,4 C12,10 15,24 15,24',
        'M25,24 C25,24 28,10 30,4 C32,10 30,24 30,24'
      ]
    }
  },
  'second-molar': {
    upper: {
      crown: 'M5,26 L5,9 C5,4 8,1 14,1 L17,0 L20,2 L23,0 L26,1 C32,1 35,4 35,9 L35,26 Z',
      roots: [
        'M10,26 C10,26 8,37 10,43 C12,37 14,26 14,26',
        'M19,26 C19,26 20,36 20,41 C20,36 21,26 21,26',
        'M26,26 C26,26 28,37 30,43 C32,37 30,26 30,26'
      ]
    },
    lower: {
      crown: 'M5,24 L5,41 C5,46 8,49 14,49 L17,50 L20,48 L23,50 L26,49 C32,49 35,46 35,41 L35,24 Z',
      roots: [
        'M11,24 C11,24 9,11 11,5 C13,11 15,24 15,24',
        'M25,24 C25,24 27,11 29,5 C31,11 29,24 29,24'
      ]
    }
  },
  'third-molar': {
    upper: {
      crown: 'M6,26 L6,10 C6,5 9,2 15,2 L18,1 L20,3 L22,1 L25,2 C31,2 34,5 34,10 L34,26 Z',
      roots: [
        'M12,26 C12,26 10,36 12,41 C14,36 15,26 15,26',
        'M25,26 C25,26 27,36 28,41 C29,36 28,26 28,26'
      ]
    },
    lower: {
      crown: 'M6,24 L6,40 C6,45 9,48 15,48 L18,49 L20,47 L22,49 L25,48 C31,48 34,45 34,40 L34,24 Z',
      roots: [
        'M12,24 C12,24 10,12 12,7 C14,12 16,24 16,24',
        'M24,24 C24,24 26,12 28,7 C30,12 28,24 28,24'
      ]
    }
  }
};

// ============================================
// FDI Tooth Layout
// ============================================

export interface ToothPosition {
  fdi: string;
  name: string;
  quadrant: 1 | 2 | 3 | 4;
  row: 'upper' | 'lower';
  side: 'right' | 'left';
  type: 'incisor' | 'canine' | 'premolar' | 'molar';
}

/**
 * FDI permanent teeth layout — ordered for visual rendering
 * Upper jaw: right to left (18→11, 21→28)
 * Lower jaw: right to left (48→41, 31→38)
 */
export const PERMANENT_TEETH_UPPER_RIGHT: string[] = ['18','17','16','15','14','13','12','11'];
export const PERMANENT_TEETH_UPPER_LEFT:  string[] = ['21','22','23','24','25','26','27','28'];
export const PERMANENT_TEETH_LOWER_RIGHT: string[] = ['48','47','46','45','44','43','42','41'];
export const PERMANENT_TEETH_LOWER_LEFT:  string[] = ['31','32','33','34','35','36','37','38'];

/**
 * FDI primary teeth layout — ordered for visual rendering
 * Upper jaw: right to left (55→51, 61→65)
 * Lower jaw: right to left (85→81, 71→75)
 */
export const PRIMARY_TEETH_UPPER_RIGHT: string[] = ['55','54','53','52','51'];
export const PRIMARY_TEETH_UPPER_LEFT:  string[] = ['61','62','63','64','65'];
export const PRIMARY_TEETH_LOWER_RIGHT: string[] = ['85','84','83','82','81'];
export const PRIMARY_TEETH_LOWER_LEFT:  string[] = ['71','72','73','74','75'];

export const TOOTH_NAMES: Record<string, string> = {
  // Q1 - Upper Right (Permanent)
  '18': 'Tercer Molar Superior Derecho',
  '17': 'Segundo Molar Superior Derecho',
  '16': 'Primer Molar Superior Derecho',
  '15': 'Segundo Premolar Superior Derecho',
  '14': 'Primer Premolar Superior Derecho',
  '13': 'Canino Superior Derecho',
  '12': 'Incisivo Lateral Superior Derecho',
  '11': 'Incisivo Central Superior Derecho',
  // Q2 - Upper Left (Permanent)
  '21': 'Incisivo Central Superior Izquierdo',
  '22': 'Incisivo Lateral Superior Izquierdo',
  '23': 'Canino Superior Izquierdo',
  '24': 'Primer Premolar Superior Izquierdo',
  '25': 'Segundo Premolar Superior Izquierdo',
  '26': 'Primer Molar Superior Izquierdo',
  '27': 'Segundo Molar Superior Izquierdo',
  '28': 'Tercer Molar Superior Izquierdo',
  // Q3 - Lower Left (Permanent)
  '31': 'Incisivo Central Inferior Izquierdo',
  '32': 'Incisivo Lateral Inferior Izquierdo',
  '33': 'Canino Inferior Izquierdo',
  '34': 'Primer Premolar Inferior Izquierdo',
  '35': 'Segundo Premolar Inferior Izquierdo',
  '36': 'Primer Molar Inferior Izquierdo',
  '37': 'Segundo Molar Inferior Izquierdo',
  '38': 'Tercer Molar Inferior Izquierdo',
  // Q4 - Lower Right (Permanent)
  '41': 'Incisivo Central Inferior Derecho',
  '42': 'Incisivo Lateral Inferior Derecho',
  '43': 'Canino Inferior Derecho',
  '44': 'Primer Premolar Inferior Derecho',
  '45': 'Segundo Premolar Inferior Derecho',
  '46': 'Primer Molar Inferior Derecho',
  '47': 'Segundo Molar Inferior Derecho',
  '48': 'Tercer Molar Inferior Derecho',
  // Q5 - Upper Right (Primary)
  '55': 'Segundo Molar Temporal Superior Derecho',
  '54': 'Primer Molar Temporal Superior Derecho',
  '53': 'Canino Temporal Superior Derecho',
  '52': 'Incisivo Lateral Temporal Superior Derecho',
  '51': 'Incisivo Central Temporal Superior Derecho',
  // Q6 - Upper Left (Primary)
  '61': 'Incisivo Central Temporal Superior Izquierdo',
  '62': 'Incisivo Lateral Temporal Superior Izquierdo',
  '63': 'Canino Temporal Superior Izquierdo',
  '64': 'Primer Molar Temporal Superior Izquierdo',
  '65': 'Segundo Molar Temporal Superior Izquierdo',
  // Q7 - Lower Left (Primary)
  '71': 'Incisivo Central Temporal Inferior Izquierdo',
  '72': 'Incisivo Lateral Temporal Inferior Izquierdo',
  '73': 'Canino Temporal Inferior Izquierdo',
  '74': 'Primer Molar Temporal Inferior Izquierdo',
  '75': 'Segundo Molar Temporal Inferior Izquierdo',
  // Q8 - Lower Right (Primary)
  '85': 'Segundo Molar Temporal Inferior Derecho',
  '84': 'Primer Molar Temporal Inferior Derecho',
  '83': 'Canino Temporal Inferior Derecho',
  '82': 'Incisivo Lateral Temporal Inferior Derecho',
  '81': 'Incisivo Central Temporal Inferior Derecho'
};

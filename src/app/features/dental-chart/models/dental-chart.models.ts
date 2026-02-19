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

export const DENTAL_CONDITIONS: string[] = [
  'caries',
  'corona',
  'implante',
  'endodoncia',
  'resina',
  'amalgama',
  'puente',
  'ortodoncia',
  'sellante',
  'fractura',
  'absceso',
  'gingivitis',
  'movilidad'
];

export const CONDITION_LABELS: Record<string, string> = {
  caries: 'Caries',
  corona: 'Corona',
  implante: 'Implante',
  endodoncia: 'Endodoncia',
  resina: 'Resina',
  amalgama: 'Amalgama',
  puente: 'Puente',
  ortodoncia: 'Ortodoncia',
  sellante: 'Sellante',
  fractura: 'Fractura',
  absceso: 'Absceso',
  gingivitis: 'Gingivitis',
  movilidad: 'Movilidad'
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

export const TOOTH_NAMES: Record<string, string> = {
  // Q1 - Upper Right
  '18': 'Tercer Molar Superior Derecho',
  '17': 'Segundo Molar Superior Derecho',
  '16': 'Primer Molar Superior Derecho',
  '15': 'Segundo Premolar Superior Derecho',
  '14': 'Primer Premolar Superior Derecho',
  '13': 'Canino Superior Derecho',
  '12': 'Incisivo Lateral Superior Derecho',
  '11': 'Incisivo Central Superior Derecho',
  // Q2 - Upper Left
  '21': 'Incisivo Central Superior Izquierdo',
  '22': 'Incisivo Lateral Superior Izquierdo',
  '23': 'Canino Superior Izquierdo',
  '24': 'Primer Premolar Superior Izquierdo',
  '25': 'Segundo Premolar Superior Izquierdo',
  '26': 'Primer Molar Superior Izquierdo',
  '27': 'Segundo Molar Superior Izquierdo',
  '28': 'Tercer Molar Superior Izquierdo',
  // Q3 - Lower Left
  '31': 'Incisivo Central Inferior Izquierdo',
  '32': 'Incisivo Lateral Inferior Izquierdo',
  '33': 'Canino Inferior Izquierdo',
  '34': 'Primer Premolar Inferior Izquierdo',
  '35': 'Segundo Premolar Inferior Izquierdo',
  '36': 'Primer Molar Inferior Izquierdo',
  '37': 'Segundo Molar Inferior Izquierdo',
  '38': 'Tercer Molar Inferior Izquierdo',
  // Q4 - Lower Right
  '41': 'Incisivo Central Inferior Derecho',
  '42': 'Incisivo Lateral Inferior Derecho',
  '43': 'Canino Inferior Derecho',
  '44': 'Primer Premolar Inferior Derecho',
  '45': 'Segundo Premolar Inferior Derecho',
  '46': 'Primer Molar Inferior Derecho',
  '47': 'Segundo Molar Inferior Derecho',
  '48': 'Tercer Molar Inferior Derecho'
};

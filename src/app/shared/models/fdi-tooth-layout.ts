// Re-export shared FDI tooth layout data from dental-chart feature
// Both dental-chart and periodontogram features can import from here
export type {
  ToothAnatomyType,
  ToothShape,
  ToothAnatomyDef,
  ToothPosition
} from '../../features/dental-chart/models/dental-chart.models';

export {
  getToothAnatomyType,
  getToothJaw,
  TOOTH_ANATOMY,
  PERMANENT_TEETH_UPPER_RIGHT,
  PERMANENT_TEETH_UPPER_LEFT,
  PERMANENT_TEETH_LOWER_RIGHT,
  PERMANENT_TEETH_LOWER_LEFT,
  PRIMARY_TEETH_UPPER_RIGHT,
  PRIMARY_TEETH_UPPER_LEFT,
  PRIMARY_TEETH_LOWER_RIGHT,
  PRIMARY_TEETH_LOWER_LEFT,
  TOOTH_NAMES
} from '../../features/dental-chart/models/dental-chart.models';

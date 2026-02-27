/**
 * Cephalometry Module — Public API
 *
 * Import this barrel file to access all models, services, components and utilities.
 *
 * Usage in your Angular app:
 *   import { CephTracerComponent } from 'path/to/cephalometry-module';
 *
 * Then add <ceph-tracer /> to your template, or import individual services.
 */

// Models
export * from './models/cephalometry.models';

// Constants
export * from './constants/landmarks.const';
export * from './constants/norms.const';

// Utilities (pure functions — framework-agnostic)
export * from './utils/ceph-math.util';

// Services
export { CephalometryAnalysisService } from './services/cephalometry-analysis.service';
export { CephalometryInterpretationService } from './services/cephalometry-interpretation.service';
export { CephalometryCalibrationService } from './services/cephalometry-calibration.service';
export { CephalometryExportService } from './services/cephalometry-export.service';

// Components
export { CephCanvasComponent } from './components/ceph-canvas/ceph-canvas.component';
export { CephResultsComponent } from './components/ceph-results/ceph-results.component';
export { CephTracerComponent } from './components/ceph-tracer/ceph-tracer.component';

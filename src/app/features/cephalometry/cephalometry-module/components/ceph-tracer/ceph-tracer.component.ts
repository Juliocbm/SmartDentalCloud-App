import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CephCanvasComponent } from '../ceph-canvas/ceph-canvas.component';
import { CephResultsComponent } from '../ceph-results/ceph-results.component';
import { PatientAutocompleteComponent } from '../../../../../shared/components/patient-autocomplete/patient-autocomplete';
import { DatePickerComponent } from '../../../../../shared/components/date-picker/date-picker';
import { PatientSearchResult } from '../../../../patients/models/patient.models';

import { CephalometryAnalysisService } from '../../services/cephalometry-analysis.service';
import { CephalometryCalibrationService } from '../../services/cephalometry-calibration.service';
import { CephalometryExportService } from '../../services/cephalometry-export.service';

import {
  LandmarkKey,
  LandmarkMap,
  Point,
  PatientData,
  MeasureResult,
  FullAnalysisResults,
  CalibrationData,
} from '../../models/cephalometry.models';
import { LANDMARKS } from '../../constants/landmarks.const';
import { todayISO } from '../../utils/ceph-math.util';
import { CephalometryApiService } from '../../../../cephalometry/services/cephalometry-api.service';
import {
  CephalometricAnalysis,
  SaveCephalometricAnalysisRequest,
  LandmarkInput,
  MeasurementInput
} from '../../../../cephalometry/models/cephalometric-analysis.models';
import { NotificationService } from '../../../../../core/services/notification.service';
import { getApiErrorMessage } from '../../../../../core/utils/api-error.utils';

@Component({
  selector: 'ceph-tracer',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    CephCanvasComponent, CephResultsComponent,
    PatientAutocompleteComponent, DatePickerComponent,
  ],
  templateUrl: './ceph-tracer.component.html',
  styleUrls: ['./ceph-tracer.component.scss'],
})
export class CephTracerComponent implements OnInit, OnDestroy {
  @Input() analysisId: string | null = null;
  @Input() patientId: string | null = null;
  @Input() initialAnalysis: CephalometricAnalysis | null = null;
  @Output() saved = new EventEmitter<CephalometricAnalysis>();
  @Output() signed = new EventEmitter<CephalometricAnalysis>();

  calibrationService = inject(CephalometryCalibrationService);
  private analysisService = inject(CephalometryAnalysisService);
  private exportService = inject(CephalometryExportService);
  private cephApiService = inject(CephalometryApiService);
  private notifications = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  saving = false;
  signing = false;
  isSigned = false;
  private imageChanged = false;

  // Image
  imageSrc: string | null = null;
  private imageBlobUrl: string | null = null;
  private imgElement: HTMLImageElement | null = null;
  private fixedScale: { sx: number; sy: number } | null = null;

  // Landmarks
  points: LandmarkMap = {};
  activeKey: LandmarkKey | null = 'S';
  placingMode = true;

  // Config
  showOverlay = true;
  enableSteiner = true;
  enableBjork = true;
  enableExtended = true;

  // Patient
  patient: PatientData = {
    name: '',
    age: '',
    sex: 'F',
    date: todayISO(),
    doctor: '',
  };
  selectedPatientId: string | null = null;
  selectedPatientName: string | null = null;

  // Calibration
  calibMode = false;
  calibKnownMm = 20;

  // Analysis results
  results: FullAnalysisResults | null = null;
  measures: MeasureResult[] = [];
  clinicalSummary = '';

  // Computed angles for overlay
  SNA = NaN;
  SNB = NaN;
  ANB = NaN;
  Saddle_NSAr = NaN;
  Articular_SArGo = NaN;
  Gonial_ArGoMe = NaN;

  readonly landmarks = LANDMARKS;

  ngOnInit(): void {
    this.calibrationService.calibration$.subscribe(() => this.recalculate());
    this.hydrateFromAnalysis();
  }

  ngOnDestroy(): void {
    if (this.imageBlobUrl) {
      URL.revokeObjectURL(this.imageBlobUrl);
    }
  }

  private hydrateFromAnalysis(): void {
    const a = this.initialAnalysis;
    if (!a) return;

    this.isSigned = a.status === 'Signed';

    // Config
    this.enableSteiner = a.enableSteiner;
    this.enableBjork = a.enableBjork;
    this.enableExtended = a.enableExtended;

    // Calibration — restore known mm and mmPerPx directly
    if (a.calibrationKnownMm != null) {
      this.calibKnownMm = a.calibrationKnownMm;
      this.calibrationService.setKnownMm(a.calibrationKnownMm);
    }

    // Patient snapshot
    this.patient = {
      name: a.patientName || '',
      age: a.patientAge || '',
      sex: (a.patientSex as 'F' | 'M') || 'F',
      date: a.examDate ? a.examDate.substring(0, 10) : todayISO(),
      doctor: a.doctorName || '',
    };
    this.selectedPatientId = a.patientId;
    this.selectedPatientName = a.patientName || null;

    // Image — cargar desde endpoint dedicado via HttpClient (incluye JWT)
    if (a.imageFileName && this.analysisId) {
      this.cephApiService.getImage(this.analysisId).subscribe({
        next: (blob) => {
          this.imageBlobUrl = URL.createObjectURL(blob);
          this.imageSrc = this.imageBlobUrl;
          this.cdr.markForCheck();
        },
        error: () => {
          // Imagen no disponible — no bloquea la hidratación
        }
      });
    }

    // Landmarks
    if (a.landmarks && a.landmarks.length > 0) {
      const pts: LandmarkMap = {};
      for (const lm of a.landmarks) {
        pts[lm.landmarkKey as LandmarkKey] = { x: lm.x, y: lm.y };
      }
      this.points = pts;
      this.activeKey = this.nextUnsetKey('S', pts);
      this.recalculate();
    }
  }

  // ---------------------------------------------------------------------------
  // Image handling
  // ---------------------------------------------------------------------------
  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.imageSrc = String(reader.result);
      this.imageChanged = true;
      this.fixedScale = null;
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  onImageLoaded(img: HTMLImageElement): void {
    this.imgElement = img;
    const rect = img.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      this.fixedScale = {
        sx: img.naturalWidth / rect.width,
        sy: img.naturalHeight / rect.height,
      };
    }
  }

  // ---------------------------------------------------------------------------
  // Calibration
  // ---------------------------------------------------------------------------
  startCalibration(): void {
    this.calibMode = true;
    this.calibrationService.reset();
    this.calibrationService.setKnownMm(this.calibKnownMm);
  }

  onKnownMmChange(): void {
    this.calibrationService.setKnownMm(this.calibKnownMm);
  }

  get calibration(): CalibrationData {
    return this.calibrationService.calibration;
  }

  get scaleLabel(): string {
    return this.calibrationService.scaleLabel;
  }

  // ---------------------------------------------------------------------------
  // Canvas interaction
  // ---------------------------------------------------------------------------
  onCanvasClick(pt: Point): void {
    // Calibration mode
    if (this.calibMode) {
      const done = this.calibrationService.addPoint(pt);
      if (done) this.calibMode = false;
      return;
    }

    // Placing landmarks
    if (this.placingMode && this.activeKey) {
      this.points = { ...this.points, [this.activeKey]: pt };
      this.activeKey = this.nextUnsetKey(this.activeKey, this.points);
      this.recalculate();
    }
  }

  onPointDragged(event: { key: LandmarkKey; point: Point }): void {
    this.points = { ...this.points, [event.key]: event.point };
    this.recalculate();
  }

  selectLandmark(key: LandmarkKey): void {
    this.activeKey = key;
  }

  isSet(key: LandmarkKey): boolean {
    return Boolean(this.points[key]);
  }

  // ---------------------------------------------------------------------------
  // Analysis
  // ---------------------------------------------------------------------------
  private recalculate(): void {
    const mmPerPx = this.calibrationService.mmPerPx;
    this.results = this.analysisService.analyze(
      this.points,
      mmPerPx,
      this.patient,
      { steiner: this.enableSteiner, bjork: this.enableBjork, extended: this.enableExtended },
    );

    this.measures = this.results.measures;
    this.clinicalSummary = this.results.clinicalSummary;

    // Feed overlay values
    this.SNA = this.results.steiner.SNA;
    this.SNB = this.results.steiner.SNB;
    this.ANB = this.results.steiner.ANB;
    this.Saddle_NSAr = this.results.bjork.Saddle_NSAr;
    this.Articular_SArGo = this.results.bjork.Articular_SArGo;
    this.Gonial_ArGoMe = this.results.bjork.Gonial_ArGoMe;
  }

  // ---------------------------------------------------------------------------
  // Exports
  // ---------------------------------------------------------------------------
  onExportCSV(): void {
    this.exportService.exportCSV(this.measures, this.patient);
  }

  onExportPNG(): void {
    if (!this.imgElement) return;
    this.exportService.exportTracePNG(this.imgElement, this.points, this.fixedScale);
  }

  onExportPDF(): void {
    // PDF export can be extended — for now trigger PNG
    this.onExportPNG();
  }

  onExportTablePNG(): void {
    // Could be implemented with canvas-based table rendering
    this.onExportCSV();
  }

  onExportJSON(): void {
    this.exportService.exportJSON(this.points, this.calibrationService.mmPerPx);
  }

  async onImportJSON(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const data = await this.exportService.importJSON(file);
      this.points = data.points;
      this.recalculate();
    } catch (err) {
      alert('JSON inválido');
    }
  }

  // ---------------------------------------------------------------------------
  // Reset
  // ---------------------------------------------------------------------------
  resetAll(): void {
    this.points = {};
    this.activeKey = 'S';
    this.calibrationService.reset();
    this.results = null;
    this.measures = [];
    this.clinicalSummary = '';
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  private nextUnsetKey(current: LandmarkKey, pts: LandmarkMap): LandmarkKey | null {
    const idx = LANDMARKS.findIndex(l => l.key === current);
    for (let k = 1; k <= LANDMARKS.length; k++) {
      const j = (idx + k) % LANDMARKS.length;
      const key = LANDMARKS[j].key;
      if (!pts[key]) return key;
    }
    return null;
  }

  onConfigChange(): void {
    this.recalculate();
  }

  onPatientSelected(patient: PatientSearchResult | null): void {
    if (patient) {
      this.patient.name = patient.name;
      this.selectedPatientId = patient.id;
      this.selectedPatientName = patient.name;
    } else {
      this.patient.name = '';
      this.selectedPatientId = null;
      this.selectedPatientName = null;
    }
    this.recalculate();
  }


  onDateChange(date: string | null): void {
    this.patient.date = date || todayISO();
    this.recalculate();
  }

  trackByKey(_: number, lm: { key: string }): string {
    return lm.key;
  }

  // ---------------------------------------------------------------------------
  // Analysis group mapping
  // ---------------------------------------------------------------------------
  private static readonly STEINER_KEYS = new Set([
    'SNA', 'SNB', 'ANB', 'SN_GoGn', 'U1_NA_deg', 'U1_NA_mm',
    'L1_NB_deg', 'L1_NB_mm', 'Interincisal', 'Pg_NB_mm'
  ]);
  private static readonly BJORK_KEYS = new Set([
    'Saddle_NSAr', 'Articular_SArGo', 'Gonial_ArGoMe', 'Sum_Bjork', 'Jarabak_Ratio'
  ]);
  private static readonly EXTENDED_KEYS = new Set([
    'IMPA', 'Wits', 'Ocl_SN', 'Facial_Angle', 'U1_SN'
  ]);

  private deriveAnalysisGroup(key: string): string {
    if (CephTracerComponent.STEINER_KEYS.has(key)) return 'steiner';
    if (CephTracerComponent.BJORK_KEYS.has(key)) return 'bjork';
    if (CephTracerComponent.EXTENDED_KEYS.has(key)) return 'extended';
    return 'soft';
  }

  // ---------------------------------------------------------------------------
  // Backend persistence
  // ---------------------------------------------------------------------------
  saveToBackend(): void {
    if (!this.analysisId || this.saving || this.isSigned) return;

    this.saving = true;

    const landmarks: LandmarkInput[] = Object.entries(this.points)
      .filter(([, pt]) => pt != null)
      .map(([key, pt]) => ({ landmarkKey: key, x: pt!.x, y: pt!.y }));

    const measurements: MeasurementInput[] = this.measures
      .filter(m => !isNaN(m.value))
      .map(m => ({
        measureKey: m.key,
        label: m.label,
        analysisGroup: this.deriveAnalysisGroup(m.key),
        value: m.value,
        units: m.units,
        normMean: m.norm.mean,
        normSD: m.norm.sd,
        zScore: isNaN(m.zScore) ? null : m.zScore,
        interpretation: m.interpretation === '—' ? null : m.interpretation,
      }));

    const request: SaveCephalometricAnalysisRequest = {
      analysisId: this.analysisId,
      rowVersion: this.initialAnalysis?.rowVersion ?? null,
      imageBase64: this.imageChanged ? (this.imageSrc || null) : null,
      calibrationMmPerPx: this.calibrationService.mmPerPx,
      calibrationKnownMm: this.calibKnownMm,
      enableSteiner: this.enableSteiner,
      enableBjork: this.enableBjork,
      enableExtended: this.enableExtended,
      patientAge: this.patient.age ? String(this.patient.age) : null,
      patientSex: this.patient.sex || null,
      doctorName: this.patient.doctor || null,
      clinicalSummary: this.clinicalSummary || null,
      notes: null,
      landmarks,
      measurements,
    };

    this.cephApiService.save(this.analysisId, request).subscribe({
      next: (updated) => {
        this.saving = false;
        this.imageChanged = false;
        this.initialAnalysis = updated;
        this.notifications.success('Análisis guardado exitosamente');
        this.saved.emit(updated);
      },
      error: (err) => {
        this.saving = false;
        this.notifications.error(getApiErrorMessage(err, 'Error al guardar análisis'));
      }
    });
  }

  signAnalysis(): void {
    if (!this.analysisId || this.signing || this.isSigned) return;

    this.signing = true;
    this.cephApiService.sign(this.analysisId).subscribe({
      next: (updated) => {
        this.signing = false;
        this.isSigned = true;
        this.initialAnalysis = updated;
        this.notifications.success('Análisis firmado exitosamente');
        this.signed.emit(updated);
      },
      error: (err) => {
        this.signing = false;
        this.notifications.error(getApiErrorMessage(err, 'Error al firmar análisis'));
      }
    });
  }
}

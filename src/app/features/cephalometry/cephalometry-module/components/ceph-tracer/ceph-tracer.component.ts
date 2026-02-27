import { Component, OnInit, inject } from '@angular/core';
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
export class CephTracerComponent implements OnInit {
  calibrationService = inject(CephalometryCalibrationService);
  private analysisService = inject(CephalometryAnalysisService);
  private exportService = inject(CephalometryExportService);

  // Image
  imageSrc: string | null = null;
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
      this.fixedScale = null;
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
}

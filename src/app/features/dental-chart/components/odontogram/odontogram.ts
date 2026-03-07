import { Component, inject, signal, computed, input, output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToothSvgComponent } from '../tooth-svg/tooth-svg';
import { ModalComponent } from '../../../../shared/components/modal/modal';
import { DentalChartService } from '../../services/dental-chart.service';
import { OdontogramEvaluationService } from '../../services/odontogram-evaluation.service';
import { OdontogramEvaluation, OdontogramToothInput } from '../../models/odontogram-evaluation.models';
import { LoggingService } from '../../../../core/services/logging.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import {
  DentalChartTooth,
  DentalChartHistoryEntry,
  UpdateToothRequest,
  ToothStatus,
  ToothSurface,
  TOOTH_STATUS_CONFIG,
  TOOTH_NAMES,
  TOOTH_SURFACES,
  SURFACE_LABELS,
  DENTAL_CONDITIONS,
  PREEXISTENCIAS,
  LESIONES,
  CONDITION_LABELS,
  PREEXISTENCIA_COLOR,
  LESION_COLOR,
  SURFACE_CONDITION_COLORS,
  SURFACE_CONDITION_LABELS,
  PERMANENT_TEETH_UPPER_RIGHT,
  PERMANENT_TEETH_UPPER_LEFT,
  PERMANENT_TEETH_LOWER_RIGHT,
  PERMANENT_TEETH_LOWER_LEFT,
  PRIMARY_TEETH_UPPER_RIGHT,
  PRIMARY_TEETH_UPPER_LEFT,
  PRIMARY_TEETH_LOWER_RIGHT,
  PRIMARY_TEETH_LOWER_LEFT
} from '../../models/dental-chart.models';

@Component({
  selector: 'app-odontogram',
  standalone: true,
  imports: [CommonModule, FormsModule, ToothSvgComponent, ModalComponent],
  templateUrl: './odontogram.html',
  styleUrl: './odontogram.scss'
})
export class OdontogramComponent implements OnInit, OnChanges {
  private dentalChartService = inject(DentalChartService);
  private evaluationService = inject(OdontogramEvaluationService);
  private logger = inject(LoggingService);
  private notifications = inject(NotificationService);

  // Inputs
  patientId = input.required<string>();
  patientName = input<string>('');
  readonly = input<boolean>(false);

  // Evaluation mode inputs (when used from OdontogramPageComponent)
  evaluationId = input<string | undefined>(undefined);
  evaluationStatus = input<string | undefined>(undefined);
  evaluationTeeth = input<DentalChartTooth[] | undefined>(undefined);

  // Outputs
  toothUpdated = output<DentalChartTooth>();
  evaluationUpdated = output<OdontogramEvaluation>();

  // Computed: readonly when evaluation is Signed
  isEvaluationReadonly = computed(() => {
    const status = this.evaluationStatus();
    return status === 'Signed' || this.readonly();
  });

  // Is in evaluation mode?
  isEvaluationMode = computed(() => !!this.evaluationId());

  // Dentition type toggle
  dentitionType = signal<'permanent' | 'primary'>('permanent');

  // State
  teeth = signal<DentalChartTooth[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  selectedTooth = signal<DentalChartTooth | null>(null);
  hoveredTooth = signal<string | null>(null);
  toothHistory = signal<DentalChartHistoryEntry[]>([]);
  loadingHistory = signal(false);
  showDetailPanel = signal(false);
  activeDetailTab = signal<'info' | 'surfaces' | 'history'>('info');

  // Edit state
  editStatus = signal<ToothStatus>('Healthy');
  editConditions = signal<Set<string>>(new Set());
  editSurfaces = signal<Record<string, string | null>>({});
  editNotes = signal<string>('');

  // Constants for template
  readonly statusConfig = TOOTH_STATUS_CONFIG;
  readonly toothNames = TOOTH_NAMES;
  readonly surfaceLabels = SURFACE_LABELS;
  readonly toothSurfaces = TOOTH_SURFACES;
  readonly dentalConditions = DENTAL_CONDITIONS;
  readonly preexistencias = PREEXISTENCIAS;
  readonly lesiones = LESIONES;
  readonly conditionLabels = CONDITION_LABELS;
  readonly preexistenciaColor = PREEXISTENCIA_COLOR;
  readonly lesionColor = LESION_COLOR;
  readonly surfaceConditionColors = SURFACE_CONDITION_COLORS;
  readonly surfaceConditionLabels = SURFACE_CONDITION_LABELS;
  readonly statusOptions: ToothStatus[] = ['Healthy', 'Treated', 'Decayed', 'Missing', 'Extracted', 'Implant'];
  readonly surfaceConditionKeys = Object.keys(SURFACE_CONDITION_COLORS);

  // Tooth layout — dynamic based on dentition type
  upperRight = computed(() =>
    this.dentitionType() === 'primary' ? PRIMARY_TEETH_UPPER_RIGHT : PERMANENT_TEETH_UPPER_RIGHT
  );
  upperLeft = computed(() =>
    this.dentitionType() === 'primary' ? PRIMARY_TEETH_UPPER_LEFT : PERMANENT_TEETH_UPPER_LEFT
  );
  lowerRight = computed(() =>
    this.dentitionType() === 'primary' ? PRIMARY_TEETH_LOWER_RIGHT : PERMANENT_TEETH_LOWER_RIGHT
  );
  lowerLeft = computed(() =>
    this.dentitionType() === 'primary' ? PRIMARY_TEETH_LOWER_LEFT : PERMANENT_TEETH_LOWER_LEFT
  );

  // Whether patient has primary teeth data loaded
  hasPrimaryTeeth = computed(() =>
    this.teeth().some(t => t.toothType === 'Primary')
  );

  // Whether patient has permanent teeth data loaded
  hasPermanentTeeth = computed(() =>
    this.teeth().some(t => t.toothType === 'Permanent')
  );

  // Computed: teeth indexed by FDI number for fast lookup (filtered by current dentition)
  teethMap = computed(() => {
    const isPrimary = this.dentitionType() === 'primary';
    const map = new Map<string, DentalChartTooth>();
    for (const t of this.teeth()) {
      const matchesType = isPrimary ? t.toothType === 'Primary' : t.toothType === 'Permanent';
      if (matchesType) {
        map.set(t.toothNumber, t);
      }
    }
    return map;
  });

  // Computed: statistics (filtered by current dentition type)
  stats = computed(() => {
    const isPrimary = this.dentitionType() === 'primary';
    const all = this.teeth().filter(t =>
      isPrimary ? t.toothType === 'Primary' : t.toothType === 'Permanent'
    );
    return {
      total: all.length,
      healthy: all.filter(t => t.status === 'Healthy').length,
      treated: all.filter(t => t.status === 'Treated').length,
      decayed: all.filter(t => t.status === 'Decayed').length,
      missing: all.filter(t => t.status === 'Missing').length,
      extracted: all.filter(t => t.status === 'Extracted').length,
      implant: all.filter(t => t.status === 'Implant').length
    };
  });

  ngOnInit(): void {
    this.loadChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['evaluationTeeth'] && this.evaluationTeeth()) {
      this.teeth.set(this.evaluationTeeth()!);
      this.loading.set(false);
    }
  }

  loadChart(): void {
    // If evaluation teeth are provided, use them directly
    const evalTeeth = this.evaluationTeeth();
    if (evalTeeth && evalTeeth.length > 0) {
      this.teeth.set(evalTeeth);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    // If in evaluation mode, load from evaluation endpoint
    const evalId = this.evaluationId();
    if (evalId) {
      this.evaluationService.getById(evalId).subscribe({
        next: (evaluation) => {
          this.teeth.set(evaluation.teeth);
          this.loading.set(false);
        },
        error: (err) => {
          this.logger.error('Error loading odontogram evaluation:', err);
          this.error.set(getApiErrorMessage(err));
          this.loading.set(false);
        }
      });
      return;
    }

    // Legacy mode: load from patient dental chart
    this.dentalChartService.getChart(this.patientId()).subscribe({
      next: (teeth) => {
        if (teeth.length === 0) {
          this.initializeChart();
        } else {
          this.teeth.set(teeth);
          this.loading.set(false);
        }
      },
      error: (err) => {
        this.logger.error('Error loading dental chart:', err);
        this.error.set(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  private initializeChart(): void {
    this.dentalChartService.initialize(this.patientId()).subscribe({
      next: (teeth) => {
        this.teeth.set(teeth);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error initializing dental chart:', err);
        this.error.set(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  initializePrimaryChart(): void {
    this.loading.set(true);
    this.dentalChartService.initialize(this.patientId(), true).subscribe({
      next: (primaryTeeth) => {
        this.teeth.update(current => [...current, ...primaryTeeth]);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error initializing primary dental chart:', err);
        this.notifications.error(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  switchDentition(type: 'permanent' | 'primary'): void {
    this.dentitionType.set(type);
    this.closeDetail();
  }

  // ============================================
  // Tooth interaction
  // ============================================

  selectTooth(fdi: string): void {
    const tooth = this.teethMap().get(fdi);
    if (!tooth) return;

    this.selectedTooth.set(tooth);
    this.showDetailPanel.set(true);
    this.activeDetailTab.set('info');

    // Initialize edit state
    this.editStatus.set(tooth.status);
    this.editConditions.set(new Set(tooth.conditions.filter(c => c !== tooth.status)));
    this.editSurfaces.set({ ...tooth.surfaceConditions });
    this.editNotes.set(tooth.notes ?? '');

    // Load history
    this.loadToothHistory(fdi);
  }

  closeDetail(): void {
    this.showDetailPanel.set(false);
    this.selectedTooth.set(null);
  }

  onToothHover(fdi: string | null): void {
    this.hoveredTooth.set(fdi);
  }

  getToothColor(fdi: string): string {
    const tooth = this.teethMap().get(fdi);
    if (!tooth) return '#E0E0E0';
    return TOOTH_STATUS_CONFIG[tooth.status]?.color ?? '#E0E0E0';
  }

  getToothStatus(fdi: string): ToothStatus {
    return this.teethMap().get(fdi)?.status ?? 'Healthy';
  }

  getToothSurfaces(fdi: string): Record<string, string | null> {
    return this.teethMap().get(fdi)?.surfaceConditions ?? {};
  }

  getToothConditions(fdi: string): string[] {
    return this.teethMap().get(fdi)?.conditions ?? [];
  }

  getEditSurfaceColor(surface: string): string {
    const condition = this.editSurfaces()[surface];
    if (!condition) return 'var(--surface-tertiary)';
    return SURFACE_CONDITION_COLORS[condition] ?? '#FFB74D';
  }

  getSurfaceColor(fdi: string, surface: ToothSurface): string {
    const tooth = this.teethMap().get(fdi);
    if (!tooth) return 'transparent';
    const condition = tooth.surfaceConditions?.[surface];
    if (!condition) return 'transparent';
    return SURFACE_CONDITION_COLORS[condition] ?? '#FFB74D';
  }

  isSelected(fdi: string): boolean {
    return this.selectedTooth()?.toothNumber === fdi;
  }

  // ============================================
  // Edit operations
  // ============================================

  toggleCondition(condition: string): void {
    const current = new Set(this.editConditions());
    if (current.has(condition)) {
      current.delete(condition);
    } else {
      current.add(condition);
    }
    this.editConditions.set(current);
  }

  setSurfaceCondition(surface: ToothSurface, condition: string | null): void {
    const current = { ...this.editSurfaces() };
    current[surface] = condition;
    this.editSurfaces.set(current);
  }

  saveTooth(): void {
    const tooth = this.selectedTooth();
    if (!tooth || this.isEvaluationReadonly()) return;

    this.saving.set(true);

    const request: UpdateToothRequest = {
      status: this.editStatus(),
      conditions: Array.from(this.editConditions()),
      surfaceConditions: this.editSurfaces(),
      notes: this.editNotes() || null
    };

    // In evaluation mode, save all teeth via bulk endpoint
    const evalId = this.evaluationId();
    if (evalId) {
      this.saveToothViaEvaluation(tooth, request, evalId);
      return;
    }

    // Legacy mode: save individual tooth
    this.dentalChartService.updateTooth(this.patientId(), tooth.toothNumber, request).subscribe({
      next: (updated) => {
        this.applyToothUpdate(tooth, updated);
      },
      error: (err) => {
        this.logger.error('Error updating tooth:', err);
        this.saving.set(false);
        this.notifications.error(getApiErrorMessage(err));
      }
    });
  }

  private saveToothViaEvaluation(tooth: DentalChartTooth, request: UpdateToothRequest, evalId: string): void {
    // Update local state first, then send all teeth to bulk endpoint
    const current = this.teeth();
    const updatedTeeth = current.map(t => {
      if (t.toothNumber === tooth.toothNumber) {
        return {
          ...t,
          status: request.status,
          conditions: request.conditions,
          surfaceConditions: request.surfaceConditions,
          notes: request.notes ?? null
        } as DentalChartTooth;
      }
      return t;
    });

    const teethInput: OdontogramToothInput[] = updatedTeeth.map(t => ({
      toothNumber: t.toothNumber,
      toothType: t.toothType,
      status: t.status,
      conditions: t.conditions ?? [],
      surfaceConditions: t.surfaceConditions ?? {},
      notes: t.notes ?? null
    }));

    this.evaluationService.saveTeeth({
      odontogramId: evalId,
      rowVersion: null,
      teeth: teethInput
    }).subscribe({
      next: (evaluation) => {
        this.teeth.set(evaluation.teeth);
        const updated = evaluation.teeth.find(t => t.toothNumber === tooth.toothNumber);
        if (updated) {
          this.selectedTooth.set(updated);
          this.toothUpdated.emit(updated);
        }
        this.evaluationUpdated.emit(evaluation);
        this.saving.set(false);
        this.notifications.success(`Pieza ${tooth.toothNumber} actualizada`);
      },
      error: (err) => {
        this.logger.error('Error saving evaluation teeth:', err);
        this.saving.set(false);
        this.notifications.error(getApiErrorMessage(err));
      }
    });
  }

  private applyToothUpdate(tooth: DentalChartTooth, updated: DentalChartTooth): void {
    const current = this.teeth();
    const idx = current.findIndex(t => t.toothNumber === tooth.toothNumber);
    if (idx >= 0) {
      const newTeeth = [...current];
      newTeeth[idx] = updated;
      this.teeth.set(newTeeth);
    }

    this.selectedTooth.set(updated);
    this.toothUpdated.emit(updated);
    this.saving.set(false);
    this.notifications.success(`Pieza ${tooth.toothNumber} actualizada`);

    // Reload history
    this.loadToothHistory(tooth.toothNumber);
  }

  // ============================================
  // History
  // ============================================

  private loadToothHistory(toothNumber: string): void {
    this.loadingHistory.set(true);
    this.dentalChartService.getToothHistory(this.patientId(), toothNumber).subscribe({
      next: (history) => {
        this.toothHistory.set(history);
        this.loadingHistory.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading tooth history:', err);
        this.loadingHistory.set(false);
      }
    });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

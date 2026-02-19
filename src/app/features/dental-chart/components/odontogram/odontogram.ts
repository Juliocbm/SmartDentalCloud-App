import { Component, inject, signal, computed, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DentalChartService } from '../../services/dental-chart.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { NotificationService } from '../../../../core/services/notification.service';
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
  CONDITION_LABELS,
  PERMANENT_TEETH_UPPER_RIGHT,
  PERMANENT_TEETH_UPPER_LEFT,
  PERMANENT_TEETH_LOWER_RIGHT,
  PERMANENT_TEETH_LOWER_LEFT
} from '../../models/dental-chart.models';

@Component({
  selector: 'app-odontogram',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './odontogram.html',
  styleUrl: './odontogram.scss'
})
export class OdontogramComponent implements OnInit {
  private dentalChartService = inject(DentalChartService);
  private logger = inject(LoggingService);
  private notifications = inject(NotificationService);

  // Inputs
  patientId = input.required<string>();
  patientName = input<string>('');
  readonly = input<boolean>(false);

  // Outputs
  toothUpdated = output<DentalChartTooth>();

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
  readonly conditionLabels = CONDITION_LABELS;
  readonly statusOptions: ToothStatus[] = ['Healthy', 'Treated', 'Decayed', 'Missing', 'Extracted', 'Implant'];

  // Tooth layout
  readonly upperRight = PERMANENT_TEETH_UPPER_RIGHT;
  readonly upperLeft = PERMANENT_TEETH_UPPER_LEFT;
  readonly lowerRight = PERMANENT_TEETH_LOWER_RIGHT;
  readonly lowerLeft = PERMANENT_TEETH_LOWER_LEFT;

  // Computed: teeth indexed by FDI number for fast lookup
  teethMap = computed(() => {
    const map = new Map<string, DentalChartTooth>();
    for (const t of this.teeth()) {
      map.set(t.toothNumber, t);
    }
    return map;
  });

  // Computed: statistics
  stats = computed(() => {
    const all = this.teeth();
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

  loadChart(): void {
    this.loading.set(true);
    this.error.set(null);

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
        this.error.set('Error al cargar el odontograma');
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
        this.error.set('Error al inicializar el odontograma');
        this.loading.set(false);
      }
    });
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

  getSurfaceColor(fdi: string, surface: ToothSurface): string {
    const tooth = this.teethMap().get(fdi);
    if (!tooth) return 'transparent';
    const condition = tooth.surfaceConditions?.[surface];
    if (!condition) return 'transparent';
    // Map surface conditions to colors
    const surfaceColors: Record<string, string> = {
      caries: '#F44336',
      resina: '#2196F3',
      amalgama: '#607D8B',
      corona: '#FF9800',
      sellante: '#8BC34A',
      fractura: '#9C27B0'
    };
    return surfaceColors[condition] ?? '#FFB74D';
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
    if (!tooth || this.readonly()) return;

    this.saving.set(true);

    const request: UpdateToothRequest = {
      status: this.editStatus(),
      conditions: Array.from(this.editConditions()),
      surfaceConditions: this.editSurfaces(),
      notes: this.editNotes() || null
    };

    this.dentalChartService.updateTooth(this.patientId(), tooth.toothNumber, request).subscribe({
      next: (updated) => {
        // Update local state
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
      },
      error: (err) => {
        this.logger.error('Error updating tooth:', err);
        this.saving.set(false);
        this.notifications.error('Error al actualizar la pieza dental');
      }
    });
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

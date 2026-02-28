import { Component, Input, Output, EventEmitter, signal, computed, inject, OnInit, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PerioMeasurementGridComponent } from '../perio-measurement-grid/perio-measurement-grid';
import { PerioStatisticsPanelComponent } from '../perio-statistics-panel/perio-statistics-panel';
import { PeriodontogramService } from '../../services/periodontogram.service';
import { PerioCalculationService } from '../../services/perio-calculation.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import {
  Periodontogram,
  PeriodontogramStatus,
  EditableTooth,
  PERIO_STATUS_CONFIG,
  toEditableTeeth,
  initializeEditableTeeth,
  toSavePayload,
  SaveMeasurementsRequest
} from '../../models/periodontogram.models';

@Component({
  selector: 'app-periodontogram-form',
  standalone: true,
  imports: [CommonModule, FormsModule, PerioMeasurementGridComponent, PerioStatisticsPanelComponent],
  templateUrl: './periodontogram-form.html',
  styleUrl: './periodontogram-form.scss'
})
export class PeriodontogramFormComponent implements OnInit, OnChanges {
  @Input() periodontogram: Periodontogram | null = null;
  @Input() patientId = '';
  @Output() saved = new EventEmitter<Periodontogram>();
  @Output() signed = new EventEmitter<Periodontogram>();
  @Output() back = new EventEmitter<void>();

  private perioService = inject(PeriodontogramService);
  private calcService = inject(PerioCalculationService);
  private notifications = inject(NotificationService);

  // Editable state
  teeth = signal<EditableTooth[]>([]);
  notes = signal('');
  rowVersion = signal<string | null>(null);
  status = signal<PeriodontogramStatus>('Draft');

  // UI state
  saving = signal(false);
  signing = signal(false);
  hasChanges = signal(false);
  lastSavedAt = signal<Date | null>(null);
  selectedTooth = signal<string | null>(null);

  // Quick stats (auto-computed from teeth)
  quickStats = computed(() => {
    const t = this.teeth();
    if (!t.length) return null;

    const allSites = t
      .filter(tooth => !tooth.isMissing)
      .flatMap(tooth => [...tooth.buccalSites, ...tooth.lingualSites]);

    const pdValues = allSites
      .filter(s => s.pd != null)
      .map(s => s.pd!);

    if (!pdValues.length) return null;

    const bleedingCount = allSites.filter(s => s.bleeding).length;
    const totalSites = allSites.length;

    return {
      avgPD: (pdValues.reduce((a, b) => a + b, 0) / pdValues.length).toFixed(2),
      bop: totalSites > 0 ? ((bleedingCount / totalSites) * 100).toFixed(1) : '0',
      sitesOver4: pdValues.filter(pd => pd > 4).length,
      sitesOver6: pdValues.filter(pd => pd > 6).length,
      missingTeeth: t.filter(tooth => tooth.isMissing).length,
      totalMeasured: pdValues.length
    };
  });

  isReadonly = computed(() => this.status() === 'Signed');
  canSign = computed(() => this.status() !== 'Signed' && !this.hasChanges());

  PERIO_STATUS_CONFIG = PERIO_STATUS_CONFIG;

  ngOnInit(): void {
    this.initializeFromInput();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['periodontogram'] && !changes['periodontogram'].firstChange) {
      this.initializeFromInput();
    }
  }

  private initializeFromInput(): void {
    if (this.periodontogram) {
      this.teeth.set(toEditableTeeth(this.periodontogram.teeth));
      this.notes.set(this.periodontogram.notes ?? '');
      this.rowVersion.set(this.periodontogram.rowVersion);
      this.status.set(this.periodontogram.status);
    } else {
      this.teeth.set(initializeEditableTeeth());
      this.notes.set('');
      this.rowVersion.set(null);
      this.status.set('Draft');
    }
    this.hasChanges.set(false);
  }

  onTeethChange(teeth: EditableTooth[]): void {
    this.teeth.set(teeth);
    this.hasChanges.set(true);
  }

  onDataChanged(): void {
    this.hasChanges.set(true);
  }

  onToothSelected(toothNumber: string): void {
    this.selectedTooth.set(
      this.selectedTooth() === toothNumber ? null : toothNumber
    );
  }

  onNotesChange(value: string): void {
    this.notes.set(value);
    this.hasChanges.set(true);
  }

  // === Save ===
  save(): void {
    if (!this.periodontogram || this.saving() || this.isReadonly()) return;

    this.saving.set(true);
    const request: SaveMeasurementsRequest = {
      periodontogramId: this.periodontogram.id,
      rowVersion: this.rowVersion(),
      teeth: toSavePayload(this.teeth())
    };

    this.perioService.saveMeasurements(request).subscribe({
      next: (result) => {
        this.saving.set(false);
        this.hasChanges.set(false);
        this.rowVersion.set(result.rowVersion);
        this.status.set(result.status);
        this.lastSavedAt.set(new Date());

        if (result.warning) {
          this.notifications.warning(result.warning);
        } else {
          this.notifications.success('Mediciones guardadas');
        }
        this.saved.emit(result);
      },
      error: (err) => {
        this.saving.set(false);
        const msg = getApiErrorMessage(err);

        // Concurrency conflict handling
        if (err.status === 409) {
          this.handleConcurrencyConflict();
          return;
        }

        this.notifications.error(msg);
      }
    });
  }

  // === Sign ===
  async sign(): Promise<void> {
    if (!this.periodontogram || this.signing() || this.isReadonly()) return;

    if (this.hasChanges()) {
      this.notifications.warning('Guarde los cambios antes de firmar');
      return;
    }

    const confirmed = await this.notifications.confirm(
      '¿Está seguro de firmar este periodontograma? Una vez firmado no se podrá modificar.'
    );
    if (!confirmed) return;

    this.signing.set(true);
    this.perioService.sign(this.periodontogram.id).subscribe({
      next: (result) => {
        this.signing.set(false);
        this.status.set(result.status);
        this.rowVersion.set(result.rowVersion);
        this.notifications.success('Periodontograma firmado exitosamente');
        this.signed.emit(result);
      },
      error: (err) => {
        this.signing.set(false);
        this.notifications.error(getApiErrorMessage(err));
      }
    });
  }

  // === Concurrency ===
  private async handleConcurrencyConflict(): Promise<void> {
    const reload = await this.notifications.confirm(
      'Este periodontograma fue modificado por otro usuario. ¿Desea recargar los datos más recientes? Se perderán los cambios no guardados.'
    );
    if (reload && this.periodontogram) {
      this.perioService.getById(this.periodontogram.id).subscribe({
        next: (fresh) => {
          this.periodontogram = fresh;
          this.initializeFromInput();
          this.notifications.success('Datos recargados');
        },
        error: (err) => {
          this.notifications.error(getApiErrorMessage(err, 'Error al recargar'));
        }
      });
    }
  }

  // === Keyboard shortcut: Ctrl+S ===
  @HostListener('document:keydown', ['$event'])
  onGlobalKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key === 's') {
      event.preventDefault();
      if (this.hasChanges() && !this.isReadonly()) {
        this.save();
      }
    }
    if (event.ctrlKey && event.key === 'Enter') {
      event.preventDefault();
      if (this.canSign()) {
        this.sign();
      }
    }
  }

  formatTime(date: Date | null): string {
    if (!date) return '';
    return new Intl.DateTimeFormat('es-MX', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(date);
  }
}

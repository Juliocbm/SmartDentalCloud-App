import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../../../shared/components/modal/modal';
import { ModalComponentBase, ModalRef, ModalConfig } from '../../../../shared/services/modal.service';
import { TreatmentsService } from '../../../treatments/services/treatments.service';
import { UnbilledTreatment } from '../../../treatments/models/treatment.models';
import { LoggingService } from '../../../../core/services/logging.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';

export interface UnbilledTreatmentsModalData {
  patientId: string;
  patientName?: string;
  appointmentId?: string;
  treatmentPlanId?: string;
}

@Component({
  selector: 'app-unbilled-treatments-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, EmptyStateComponent],
  templateUrl: './unbilled-treatments-modal.html',
  styleUrl: './unbilled-treatments-modal.scss'
})
export class UnbilledTreatmentsModalComponent implements ModalComponentBase<UnbilledTreatmentsModalData, UnbilledTreatment[]>, OnInit {
  private treatmentsService = inject(TreatmentsService);
  private logger = inject(LoggingService);

  modalData?: UnbilledTreatmentsModalData;
  modalRef?: ModalRef<UnbilledTreatmentsModalData, UnbilledTreatment[]>;
  modalConfig?: ModalConfig<UnbilledTreatmentsModalData>;

  treatments = signal<UnbilledTreatment[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  selectedIds = signal<Set<string>>(new Set());

  ngOnInit(): void {
    this.loadTreatments();
  }

  private loadTreatments(): void {
    if (!this.modalData?.patientId) return;

    this.loading.set(true);
    this.error.set(null);

    this.treatmentsService.getUnbilledByPatient(
      this.modalData.patientId,
      this.modalData.appointmentId,
      this.modalData.treatmentPlanId
    ).subscribe({
      next: (data) => {
        this.treatments.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading unbilled treatments:', err);
        this.error.set('Error al cargar tratamientos sin facturar');
        this.loading.set(false);
      }
    });
  }

  toggleSelection(id: string): void {
    const current = new Set(this.selectedIds());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.selectedIds.set(current);
  }

  toggleAll(): void {
    const all = this.treatments();
    const current = this.selectedIds();
    if (current.size === all.length) {
      this.selectedIds.set(new Set());
    } else {
      this.selectedIds.set(new Set(all.map(t => t.id)));
    }
  }

  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  get allSelected(): boolean {
    return this.treatments().length > 0 && this.selectedIds().size === this.treatments().length;
  }

  get selectedCount(): number {
    return this.selectedIds().size;
  }

  get selectedTotal(): number {
    const ids = this.selectedIds();
    return this.treatments()
      .filter(t => ids.has(t.id))
      .reduce((sum, t) => sum + t.cost, 0);
  }

  onConfirm(): void {
    const ids = this.selectedIds();
    const selected = this.treatments().filter(t => ids.has(t.id));
    this.modalRef?.close(selected);
  }

  onClose(): void {
    this.modalRef?.close();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
}

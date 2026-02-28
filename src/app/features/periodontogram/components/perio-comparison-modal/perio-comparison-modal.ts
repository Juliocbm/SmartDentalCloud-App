import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../../../shared/components/modal/modal';
import { ModalComponentBase, ModalRef, ModalConfig } from '../../../../shared/services/modal.service';
import { PeriodontogramService } from '../../services/periodontogram.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import {
  PeriodontogramComparison,
  PeriodontogramListItem
} from '../../models/periodontogram.models';

export interface PerioComparisonModalData {
  patientId: string;
  items: PeriodontogramListItem[];
}

@Component({
  selector: 'app-perio-comparison-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './perio-comparison-modal.html',
  styleUrl: './perio-comparison-modal.scss'
})
export class PerioComparisonModalComponent implements ModalComponentBase<PerioComparisonModalData>, OnInit {
  modalData?: PerioComparisonModalData;
  modalRef?: ModalRef<PerioComparisonModalData>;
  modalConfig?: ModalConfig<PerioComparisonModalData>;

  private perioService = inject(PeriodontogramService);
  private notifications = inject(NotificationService);

  items = signal<PeriodontogramListItem[]>([]);
  selectedId1 = signal<string | null>(null);
  selectedId2 = signal<string | null>(null);
  comparison = signal<PeriodontogramComparison | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    if (this.modalData) {
      this.items.set(this.modalData.items);
      // Auto-select last two if available
      if (this.modalData.items.length >= 2) {
        this.selectedId1.set(this.modalData.items[1].id); // older = baseline
        this.selectedId2.set(this.modalData.items[0].id); // newer = current
      }
    }
  }

  onSelect1(id: string): void {
    this.selectedId1.set(id);
    this.comparison.set(null);
  }

  onSelect2(id: string): void {
    this.selectedId2.set(id);
    this.comparison.set(null);
  }

  canCompare(): boolean {
    const id1 = this.selectedId1();
    const id2 = this.selectedId2();
    return !!id1 && !!id2 && id1 !== id2;
  }

  compare(): void {
    const id1 = this.selectedId1();
    const id2 = this.selectedId2();
    if (!id1 || !id2) return;

    this.loading.set(true);
    this.error.set(null);

    this.perioService.compare(id1, id2).subscribe({
      next: (data) => {
        this.comparison.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(getApiErrorMessage(err, 'Error al comparar'));
        this.loading.set(false);
      }
    });
  }

  close(): void {
    this.modalRef?.close();
  }

  formatDate(date: string | null): string {
    if (!date) return '—';
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(new Date(date));
  }

  formatDecimal(value: number | null): string {
    if (value == null) return '—';
    return value.toFixed(2);
  }

  formatChange(value: number | null): string {
    if (value == null) return '—';
    const sign = value > 0 ? '+' : '';
    return sign + value.toFixed(2);
  }

  getChangeClass(value: number | null, inverted = false): string {
    if (value == null) return '';
    // For PD/CAL: negative = improved, positive = worsened
    // For BOP: negative = improved
    if (inverted) {
      return value > 0 ? 'change-improved' : value < 0 ? 'change-worsened' : '';
    }
    return value < 0 ? 'change-improved' : value > 0 ? 'change-worsened' : '';
  }

  getTrendIcon(trend: string): string {
    switch (trend) {
      case 'Improving': return 'fa-arrow-trend-down';
      case 'Worsening': return 'fa-arrow-trend-up';
      default: return 'fa-minus';
    }
  }

  getTrendClass(trend: string): string {
    switch (trend) {
      case 'Improving': return 'trend-improving';
      case 'Worsening': return 'trend-worsening';
      default: return 'trend-stable';
    }
  }

  getTrendLabel(trend: string): string {
    switch (trend) {
      case 'Improving': return 'Mejorando';
      case 'Worsening': return 'Empeorando';
      default: return 'Estable';
    }
  }
}

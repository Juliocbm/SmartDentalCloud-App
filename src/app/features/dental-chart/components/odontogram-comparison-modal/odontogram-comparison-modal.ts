import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../../../shared/components/modal/modal';
import { ModalComponentBase, ModalRef, ModalConfig } from '../../../../shared/services/modal.service';
import { OdontogramEvaluationService } from '../../services/odontogram-evaluation.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import {
  OdontogramComparison,
  OdontogramListItem
} from '../../models/odontogram-evaluation.models';

export interface OdontogramComparisonModalData {
  patientId: string;
  items: OdontogramListItem[];
}

@Component({
  selector: 'app-odontogram-comparison-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './odontogram-comparison-modal.html',
  styleUrl: './odontogram-comparison-modal.scss'
})
export class OdontogramComparisonModalComponent implements ModalComponentBase<OdontogramComparisonModalData>, OnInit {
  modalData?: OdontogramComparisonModalData;
  modalRef?: ModalRef<OdontogramComparisonModalData>;
  modalConfig?: ModalConfig<OdontogramComparisonModalData>;

  private odontogramService = inject(OdontogramEvaluationService);
  private notifications = inject(NotificationService);

  items = signal<OdontogramListItem[]>([]);
  selectedId1 = signal<string | null>(null);
  selectedId2 = signal<string | null>(null);
  comparison = signal<OdontogramComparison | null>(null);
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

    this.odontogramService.compare(id1, id2).subscribe({
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

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      Healthy: 'Sano',
      Treated: 'Tratado',
      Decayed: 'Caries',
      Missing: 'Ausente',
      Extracted: 'Extraído',
      Implant: 'Implante'
    };
    return map[status] || status;
  }
}

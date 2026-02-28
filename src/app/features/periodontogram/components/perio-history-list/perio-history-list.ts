import { Component, Input, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PeriodontogramService } from '../../services/periodontogram.service';
import {
  PeriodontogramListItem,
  PERIO_STATUS_CONFIG,
  RISK_LEVEL_CONFIG
} from '../../models/periodontogram.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { ModalService } from '../../../../shared/services/modal.service';
import { PerioComparisonModalComponent, PerioComparisonModalData } from '../perio-comparison-modal/perio-comparison-modal';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';

@Component({
  selector: 'app-perio-history-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './perio-history-list.html',
  styleUrl: './perio-history-list.scss'
})
export class PerioHistoryListComponent implements OnInit {
  @Input({ required: true }) patientId!: string;
  @Input() patientName = '';

  private perioService = inject(PeriodontogramService);
  private notifications = inject(NotificationService);
  private modalService = inject(ModalService);
  private router = inject(Router);

  items = signal<PeriodontogramListItem[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  PERIO_STATUS_CONFIG = PERIO_STATUS_CONFIG;
  RISK_LEVEL_CONFIG = RISK_LEVEL_CONFIG;

  ngOnInit(): void {
    this.loadList();
  }

  loadList(): void {
    this.loading.set(true);
    this.error.set(null);

    this.perioService.getByPatient(this.patientId).subscribe({
      next: (data) => {
        this.items.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(getApiErrorMessage(err, 'Error al cargar periodontogramas'));
        this.loading.set(false);
      }
    });
  }

  openPeriodontogram(id: string): void {
    this.router.navigate(['/patients', this.patientId, 'periodontogram', id]);
  }

  createNew(): void {
    this.router.navigate(['/patients', this.patientId, 'periodontogram', 'new']);
  }

  async deletePeriodontogram(item: PeriodontogramListItem): Promise<void> {
    if (item.status === 'Signed') {
      this.notifications.error('No se puede eliminar un periodontograma firmado');
      return;
    }

    const confirmed = await this.notifications.confirm(
      `¿Está seguro de eliminar el periodontograma del ${this.formatDate(item.examDate)}?`
    );
    if (!confirmed) return;

    this.perioService.delete(item.id).subscribe({
      next: () => {
        this.notifications.success('Periodontograma eliminado');
        this.loadList();
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
      }
    });
  }

  formatDate(date: string | null): string {
    if (!date) return '—';
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(new Date(date));
  }

  async duplicatePeriodontogram(item: PeriodontogramListItem): Promise<void> {
    const confirmed = await this.notifications.confirm(
      `¿Crear un nuevo periodontograma basado en el del ${this.formatDate(item.examDate)}? Se copiarán las mediciones como punto de partida.`
    );
    if (!confirmed) return;

    this.perioService.duplicate(item.id).subscribe({
      next: (newPerio) => {
        this.notifications.success('Periodontograma duplicado exitosamente');
        this.router.navigate(['/patients', this.patientId, 'periodontogram', newPerio.id]);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err, 'Error al duplicar'));
      }
    });
  }

  openComparison(): void {
    const items = this.items();
    if (items.length < 2) {
      this.notifications.warning('Se necesitan al menos 2 periodontogramas para comparar');
      return;
    }

    this.modalService.open<PerioComparisonModalData>(PerioComparisonModalComponent, {
      data: {
        patientId: this.patientId,
        items: items
      },
      width: '900px'
    });
  }

  formatDecimal(value: number | null): string {
    if (value == null) return '—';
    return value.toFixed(2);
  }
}

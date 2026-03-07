import { Component, Input, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OdontogramEvaluationService } from '../../services/odontogram-evaluation.service';
import {
  OdontogramListItem,
  ODONTOGRAM_STATUS_CONFIG
} from '../../models/odontogram-evaluation.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { ModalService } from '../../../../shared/services/modal.service';
import {
  OdontogramComparisonModalComponent,
  OdontogramComparisonModalData
} from '../odontogram-comparison-modal/odontogram-comparison-modal';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';

@Component({
  selector: 'app-odontogram-history-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './odontogram-history-list.html',
  styleUrl: './odontogram-history-list.scss'
})
export class OdontogramHistoryListComponent implements OnInit {
  @Input({ required: true }) patientId!: string;
  @Input() patientName = '';

  private odontogramService = inject(OdontogramEvaluationService);
  private notifications = inject(NotificationService);
  private modalService = inject(ModalService);
  private router = inject(Router);

  items = signal<OdontogramListItem[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  ODONTOGRAM_STATUS_CONFIG = ODONTOGRAM_STATUS_CONFIG;

  ngOnInit(): void {
    this.loadList();
  }

  loadList(): void {
    this.loading.set(true);
    this.error.set(null);

    this.odontogramService.getByPatient(this.patientId).subscribe({
      next: (data) => {
        this.items.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(getApiErrorMessage(err, 'Error al cargar odontogramas'));
        this.loading.set(false);
      }
    });
  }

  openOdontogram(id: string): void {
    this.router.navigate(['/patients', this.patientId, 'odontogram', id]);
  }

  createNew(): void {
    this.router.navigate(['/patients', this.patientId, 'odontogram', 'new']);
  }

  async deleteOdontogram(item: OdontogramListItem): Promise<void> {
    if (item.status === 'Signed') {
      this.notifications.error('No se puede eliminar un odontograma firmado');
      return;
    }

    const confirmed = await this.notifications.confirm(
      `¿Está seguro de eliminar el odontograma del ${this.formatDate(item.examDate)}?`
    );
    if (!confirmed) return;

    this.odontogramService.delete(item.id).subscribe({
      next: () => {
        this.notifications.success('Odontograma eliminado');
        this.loadList();
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
      }
    });
  }

  async duplicateOdontogram(item: OdontogramListItem): Promise<void> {
    const confirmed = await this.notifications.confirm(
      `¿Crear un nuevo odontograma basado en el del ${this.formatDate(item.examDate)}? Se copiarán las piezas dentales como punto de partida.`
    );
    if (!confirmed) return;

    this.odontogramService.duplicate(item.id).subscribe({
      next: (newOdontogram) => {
        this.notifications.success('Odontograma duplicado exitosamente');
        this.router.navigate(['/patients', this.patientId, 'odontogram', newOdontogram.id]);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err, 'Error al duplicar'));
      }
    });
  }

  openComparison(): void {
    const items = this.items();
    if (items.length < 2) {
      this.notifications.warning('Se necesitan al menos 2 odontogramas para comparar');
      return;
    }

    this.modalService.open<OdontogramComparisonModalData>(OdontogramComparisonModalComponent, {
      data: {
        patientId: this.patientId,
        items: items
      },
      width: '900px'
    });
  }

  formatDate(date: string | null): string {
    if (!date) return '—';
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(new Date(date));
  }
}

import { Component, Input, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CephalometryApiService } from '../../services/cephalometry-api.service';
import {
  CephalometricAnalysisListItem,
  CEPH_STATUS_CONFIG
} from '../../models/cephalometric-analysis.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { DateFormatService } from '../../../../core/services/date-format.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-ceph-history-list',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent],
  templateUrl: './ceph-history-list.html',
  styleUrl: './ceph-history-list.scss'
})
export class CephHistoryListComponent implements OnInit {
  @Input({ required: true }) patientId!: string;
  @Input() patientName = '';

  private cephService = inject(CephalometryApiService);
  private notifications = inject(NotificationService);
  private router = inject(Router);

  items = signal<CephalometricAnalysisListItem[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  CEPH_STATUS_CONFIG = CEPH_STATUS_CONFIG;

  ngOnInit(): void {
    this.loadList();
  }

  loadList(): void {
    this.loading.set(true);
    this.error.set(null);

    this.cephService.getByPatient(this.patientId).subscribe({
      next: (data) => {
        this.items.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(getApiErrorMessage(err, 'Error al cargar análisis cefalométricos'));
        this.loading.set(false);
      }
    });
  }

  openAnalysis(id: string): void {
    this.router.navigate(['/patients', this.patientId, 'cephalometry', id]);
  }

  createNew(): void {
    this.router.navigate(['/patients', this.patientId, 'cephalometry', 'new']);
  }

  async deleteAnalysis(item: CephalometricAnalysisListItem): Promise<void> {
    if (item.status === 'Signed') {
      this.notifications.error('No se puede eliminar un análisis firmado');
      return;
    }

    const confirmed = await this.notifications.confirm(
      `¿Está seguro de eliminar el análisis cefalométrico del ${this.formatDate(item.examDate)}?`
    );
    if (!confirmed) return;

    this.cephService.delete(item.id).subscribe({
      next: () => {
        this.notifications.success('Análisis cefalométrico eliminado');
        this.loadList();
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
      }
    });
  }

  formatDate(date: string | null): string {
    return DateFormatService.shortDate(date);
  }

  getAnalysisTypes(item: CephalometricAnalysisListItem): string {
    const types: string[] = [];
    if (item.enableSteiner) types.push('Steiner');
    if (item.enableBjork) types.push('Björk');
    if (item.enableExtended) types.push('Extended');
    return types.join(', ') || '—';
  }
}

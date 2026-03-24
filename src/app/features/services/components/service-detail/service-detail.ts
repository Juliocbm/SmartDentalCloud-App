import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { ServicesService } from '../../services/services.service';
import { DentalServiceItem, SERVICE_CATEGORIES, TreatmentSummary, ServiceStatistics, PriceChange } from '../../models/service.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuditInfoComponent } from '../../../../shared/components/audit-info/audit-info';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { PermissionService, PERMISSIONS } from '../../../../core/services/permission.service';
import { DateFormatService } from '../../../../core/services/date-format.service';

@Component({
  selector: 'app-service-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent, AuditInfoComponent],
  templateUrl: './service-detail.html',
  styleUrl: './service-detail.scss'
})
export class ServiceDetailComponent implements OnInit {
  showAuditModal = signal(false);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private servicesService = inject(ServicesService);
  private notifications = inject(NotificationService);
  private location = inject(Location);
  permissionService = inject(PermissionService);

  service = signal<DentalServiceItem | null>(null);
  loading = signal(false);
  deleting = signal(false);
  error = signal<string | null>(null);
  showDeleteConfirm = signal(false);

  // Analytics
  linkedTreatments = signal<TreatmentSummary[]>([]);
  statistics = signal<ServiceStatistics | null>(null);
  priceHistory = signal<PriceChange[]>([]);
  loadingTreatments = signal(false);
  loadingStats = signal(false);
  loadingHistory = signal(false);
  showTreatmentsSection = signal(false);
  showStatsSection = signal(false);
  showHistorySection = signal(false);

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Servicios', route: '/services' },
    { label: 'Detalle' }
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadService(id);
      this.loadAnalytics(id);
    }
  }

  private loadService(id: string): void {
    this.loading.set(true);
    this.servicesService.getById(id).subscribe({
      next: (data) => {
        this.service.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  private loadAnalytics(serviceId: string): void {
    this.loadLinkedTreatments(serviceId);
    this.loadStatistics(serviceId);
    this.loadPriceHistory(serviceId);
  }

  private loadLinkedTreatments(serviceId: string): void {
    this.loadingTreatments.set(true);
    this.servicesService.getLinkedTreatments(serviceId).subscribe({
      next: (data) => {
        this.linkedTreatments.set(data);
        this.loadingTreatments.set(false);
      },
      error: () => {
        this.loadingTreatments.set(false);
      }
    });
  }

  private loadStatistics(serviceId: string): void {
    this.loadingStats.set(true);
    this.servicesService.getStatistics(serviceId).subscribe({
      next: (data) => {
        this.statistics.set(data);
        this.loadingStats.set(false);
      },
      error: () => {
        this.loadingStats.set(false);
      }
    });
  }

  toggleTreatmentsSection(): void {
    this.showTreatmentsSection.set(!this.showTreatmentsSection());
  }

  toggleStatsSection(): void {
    this.showStatsSection.set(!this.showStatsSection());
  }

  toggleHistorySection(): void {
    this.showHistorySection.set(!this.showHistorySection());
  }

  private loadPriceHistory(serviceId: string): void {
    this.loadingHistory.set(true);
    this.servicesService.getPriceHistory(serviceId).subscribe({
      next: (data) => {
        this.priceHistory.set(data);
        this.loadingHistory.set(false);
      },
      error: () => {
        this.loadingHistory.set(false);
      }
    });
  }

  getCategoryLabel(value?: string): string {
    if (!value) return '—';
    return SERVICE_CATEGORIES.find(c => c.value === value)?.label || value;
  }

  getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      'Scheduled': 'Programado',
      'InProgress': 'En Progreso',
      'Completed': 'Completado',
      'Cancelled': 'Cancelado'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    const classMap: Record<string, string> = {
      'Scheduled': 'badge-info',
      'InProgress': 'badge-warning',
      'Completed': 'badge-success',
      'Cancelled': 'badge-neutral'
    };
    return classMap[status] || 'badge-neutral';
  }

  confirmDelete(): void {
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
  }

  deleteService(): void {
    const svc = this.service();
    if (!svc || this.deleting()) return;

    this.deleting.set(true);
    this.servicesService.delete(svc.id).subscribe({
      next: () => {
        this.notifications.success('Servicio eliminado');
        this.router.navigate(['/services']);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
        this.deleting.set(false);
        this.showDeleteConfirm.set(false);
      }
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }

  formatDate(date: Date | string | undefined): string {
    return DateFormatService.shortDate(date);
  }
}

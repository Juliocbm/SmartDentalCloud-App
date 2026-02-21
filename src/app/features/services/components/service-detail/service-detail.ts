import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { ServicesService } from '../../services/services.service';
import { DentalServiceItem, SERVICE_CATEGORIES } from '../../models/service.models';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-service-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent],
  templateUrl: './service-detail.html',
  styleUrl: './service-detail.scss'
})
export class ServiceDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private servicesService = inject(ServicesService);
  private notifications = inject(NotificationService);
  private location = inject(Location);

  service = signal<DentalServiceItem | null>(null);
  loading = signal(false);
  deleting = signal(false);
  error = signal<string | null>(null);
  showDeleteConfirm = signal(false);

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Servicios', route: '/services' },
    { label: 'Detalle' }
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadService(id);
  }

  private loadService(id: string): void {
    this.loading.set(true);
    this.servicesService.getById(id).subscribe({
      next: (data) => {
        this.service.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar el servicio');
        this.loading.set(false);
      }
    });
  }

  getCategoryLabel(value?: string): string {
    if (!value) return '—';
    return SERVICE_CATEGORIES.find(c => c.value === value)?.label || value;
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
      error: () => {
        this.notifications.error('Error al eliminar el servicio');
        this.deleting.set(false);
        this.showDeleteConfirm.set(false);
      }
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '—';
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(new Date(date));
  }
}

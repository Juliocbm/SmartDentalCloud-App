import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { ServicesService } from '../../services/services.service';
import { DentalServiceItem } from '../../models/service.models';
import { LoggingService } from '../../../../core/services/logging.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-service-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PageHeaderComponent],
  templateUrl: './service-list.html',
  styleUrl: './service-list.scss'
})
export class ServiceListComponent implements OnInit, OnDestroy {
  private servicesService = inject(ServicesService);
  private logger = inject(LoggingService);
  private notifications = inject(NotificationService);
  private searchSubject = new Subject<string>();

  // State
  allServices = signal<DentalServiceItem[]>([]);
  filteredServices = signal<DentalServiceItem[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);
  totalItems = signal(0);
  totalPages = signal(0);

  // Filters
  searchTerm = signal('');
  filterStatus = signal<'all' | 'active' | 'inactive'>('all');
  filterCategory = signal<string>('all');

  // Computed - paginated items for display
  paginatedServices = computed(() => {
    const filtered = this.filteredServices();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return filtered.slice(start, start + size);
  });

  categories = computed(() => {
    const cats = this.allServices()
      .map(s => s.category)
      .filter((c): c is string => !!c);
    return [...new Set(cats)].sort();
  });

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Catálogo de Servicios' }
  ];

  Math = Math;

  ngOnInit(): void {
    this.loadServices();

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchTerm.set(term);
      this.currentPage.set(1);
      this.applyFilters();
    });
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  loadServices(): void {
    this.loading.set(true);
    this.error.set(null);

    this.servicesService.getAll().subscribe({
      next: (data) => {
        this.allServices.set(data);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading services:', err);
        this.error.set('Error al cargar servicios. Por favor intente nuevamente.');
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.allServices()];

    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(search) ||
        s.description?.toLowerCase().includes(search) ||
        s.category?.toLowerCase().includes(search) ||
        s.claveProdServ?.toLowerCase().includes(search)
      );
    }

    const status = this.filterStatus();
    if (status === 'active') {
      filtered = filtered.filter(s => s.isActive);
    } else if (status === 'inactive') {
      filtered = filtered.filter(s => !s.isActive);
    }

    const category = this.filterCategory();
    if (category !== 'all') {
      filtered = filtered.filter(s => s.category === category);
    }

    this.filteredServices.set(filtered);
    this.totalItems.set(filtered.length);
    this.totalPages.set(Math.ceil(filtered.length / this.pageSize()));

    if (this.currentPage() > this.totalPages() && this.totalPages() > 0) {
      this.currentPage.set(this.totalPages());
    }
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  onStatusFilterChange(value: string): void {
    this.filterStatus.set(value as 'all' | 'active' | 'inactive');
    this.currentPage.set(1);
    this.applyFilters();
  }

  onCategoryFilterChange(value: string): void {
    this.filterCategory.set(value);
    this.currentPage.set(1);
    this.applyFilters();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  getPaginationPages(): number[] {
    const pages: number[] = [];
    const current = this.currentPage();
    const total = this.totalPages();

    const maxVisible = 5;
    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    let end = Math.min(total, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  async deleteService(service: DentalServiceItem): Promise<void> {
    const confirmed = await this.notifications.confirm(
      `¿Está seguro de eliminar el servicio "${service.name}"? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    this.servicesService.delete(service.id).subscribe({
      next: () => {
        this.notifications.success('Servicio eliminado exitosamente');
        this.loadServices();
      },
      error: (err) => {
        this.logger.error('Error deleting service:', err);
        this.notifications.error('Error al eliminar el servicio');
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  }
}

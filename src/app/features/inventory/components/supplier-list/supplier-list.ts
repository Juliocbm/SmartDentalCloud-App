import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { SuppliersService } from '../../services/suppliers.service';
import { Supplier } from '../../models/supplier.models';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoggingService } from '../../../../core/services/logging.service';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PageHeaderComponent],
  templateUrl: './supplier-list.html',
  styleUrls: ['./supplier-list.scss']
})
export class SupplierListComponent implements OnInit, OnDestroy {
  private suppliersService = inject(SuppliersService);
  private notifications = inject(NotificationService);
  private logger = inject(LoggingService);
  private searchSubject = new Subject<string>();

  suppliers = signal<Supplier[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  searchTerm = signal('');
  filterStatus = signal<'all' | 'active' | 'inactive'>('all');

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);

  breadcrumbItems = signal<BreadcrumbItem[]>([
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Inventario', route: '/inventory', icon: 'fa-boxes-stacked' },
    { label: 'Proveedores', route: '/inventory/suppliers', icon: 'fa-truck' }
  ]);

  filteredSuppliers = computed(() => {
    let result = this.suppliers();

    const search = this.searchTerm().toLowerCase().trim();
    if (search) {
      result = result.filter(s =>
        s.name.toLowerCase().includes(search) ||
        s.code.toLowerCase().includes(search) ||
        (s.contactName && s.contactName.toLowerCase().includes(search)) ||
        (s.email && s.email.toLowerCase().includes(search)) ||
        (s.phone && s.phone.toLowerCase().includes(search))
      );
    }

    const status = this.filterStatus();
    if (status === 'active') {
      result = result.filter(s => s.isActive);
    } else if (status === 'inactive') {
      result = result.filter(s => !s.isActive);
    }

    return result;
  });

  totalPages = computed(() => Math.ceil(this.filteredSuppliers().length / this.pageSize()) || 1);

  paginatedSuppliers = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredSuppliers().slice(start, start + this.pageSize());
  });

  ngOnInit(): void {
    this.loadData();
    this.setupSearchDebounce();
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  private setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchTerm.set(term);
      this.currentPage.set(1);
    });
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    this.suppliersService.getAll().subscribe({
      next: (suppliers) => {
        this.suppliers.set(suppliers);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading suppliers:', err);
        this.error.set('Error al cargar proveedores. Por favor, intenta de nuevo.');
        this.loading.set(false);
      }
    });
  }

  onSearchInput(value: string): void {
    this.searchSubject.next(value);
  }

  onStatusFilterChange(status: 'all' | 'active' | 'inactive'): void {
    this.filterStatus.set(status);
    this.currentPage.set(1);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  getPaginationPages(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const maxVisible = 5;
    const pages: number[] = [];
    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    const end = Math.min(total, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  async deleteSupplier(id: string): Promise<void> {
    const confirmed = await this.notifications.confirm('¿Estás seguro de que deseas eliminar este proveedor?');
    if (!confirmed) return;

    this.suppliersService.delete(id).subscribe({
      next: () => {
        this.notifications.success('Proveedor eliminado correctamente.');
        this.loadData();
      },
      error: () => {
        this.notifications.error('Error al eliminar proveedor.');
      }
    });
  }
}

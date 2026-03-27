import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { CategoriesService } from '../../services/categories.service';
import { Category } from '../../models/category.models';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { ROUTES } from '../../../../core/constants/routes.constants';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { PermissionService, PERMISSIONS } from '../../../../core/services/permission.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PageHeaderComponent, EmptyStateComponent],
  templateUrl: './category-list.html',
  styleUrls: ['./category-list.scss']
})
export class CategoryListComponent implements OnInit, OnDestroy {
  permissionService = inject(PermissionService);
  PERMISSIONS = PERMISSIONS;
  private categoriesService = inject(CategoriesService);
  private notifications = inject(NotificationService);
  private logger = inject(LoggingService);
  private searchSubject = new Subject<string>();

  categories = signal<Category[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  searchTerm = signal('');
  filterStatus = signal<'all' | 'active' | 'inactive'>('all');
  sortColumn = signal<string>('name');
  sortDirection = signal<'asc' | 'desc'>('asc');

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);

  breadcrumbItems = signal<BreadcrumbItem[]>([
    { label: 'Dashboard', route: ROUTES.DASHBOARD, icon: 'fa-home' },
    { label: 'Inventario', route: ROUTES.INVENTORY, icon: 'fa-boxes-stacked' },
    { label: 'Categorías' }
  ]);

  filteredCategories = computed(() => {
    let result = this.categories();

    const search = this.searchTerm().toLowerCase().trim();
    if (search) {
      result = result.filter(c =>
        c.name.toLowerCase().includes(search) ||
        (c.description && c.description.toLowerCase().includes(search))
      );
    }

    const status = this.filterStatus();
    if (status === 'active') {
      result = result.filter(c => c.isActive);
    } else if (status === 'inactive') {
      result = result.filter(c => !c.isActive);
    }

    // Sort
    const col = this.sortColumn();
    const dir = this.sortDirection();
    return [...result].sort((a, b) => {
      let aVal: any;
      let bVal: any;
      switch (col) {
        case 'name':   aVal = a.name?.toLowerCase() ?? '';  bVal = b.name?.toLowerCase() ?? '';  break;
        case 'status': aVal = a.isActive ? 0 : 1;           bVal = b.isActive ? 0 : 1;           break;
        default: return 0;
      }
      if (aVal < bVal) return dir === 'asc' ? -1 : 1;
      if (aVal > bVal) return dir === 'asc' ?  1 : -1;
      return 0;
    });
  });

  totalPages = computed(() => Math.ceil(this.filteredCategories().length / this.pageSize()) || 1);

  paginatedCategories = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredCategories().slice(start, start + this.pageSize());
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

    this.categoriesService.getAll().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading categories:', err);
        this.error.set(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  onSort(column: string): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
    this.currentPage.set(1);
  }

  getSortIcon(column: string): string {
    if (this.sortColumn() !== column) return 'fa-sort';
    return this.sortDirection() === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  onStatusFilterChange(value: string): void {
    this.filterStatus.set(value as 'all' | 'active' | 'inactive');
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

  async deleteCategory(category: Category): Promise<void> {
    const confirmed = await this.notifications.confirm(`¿Estás seguro de eliminar la categoría "${category.name}"?`);
    if (!confirmed) return;

    this.categoriesService.delete(category.id).subscribe({
      next: () => {
        this.categories.update(cats => cats.filter(c => c.id !== category.id));
        this.notifications.success('Categoría eliminada correctamente.');
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
      }
    });
  }
}

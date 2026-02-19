import { Component, OnInit, signal, computed, inject } from '@angular/core';
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

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PageHeaderComponent],
  templateUrl: './category-list.html',
  styleUrls: ['./category-list.scss']
})
export class CategoryListComponent implements OnInit {
  private categoriesService = inject(CategoriesService);
  private notifications = inject(NotificationService);
  private logger = inject(LoggingService);
  private searchSubject = new Subject<string>();

  categories = signal<Category[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  searchTerm = signal('');
  filterStatus = signal<'all' | 'active' | 'inactive'>('all');

  breadcrumbItems = signal<BreadcrumbItem[]>([
    { label: 'Inicio', route: ROUTES.DASHBOARD, icon: 'fa-home' },
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

    return result;
  });

  ngOnInit(): void {
    this.loadData();
    this.setupSearchDebounce();
  }

  private setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchTerm.set(term);
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
        this.error.set('Error al cargar las categorías. Por favor, intenta de nuevo.');
        this.loading.set(false);
      }
    });
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  onStatusFilterChange(value: string): void {
    this.filterStatus.set(value as 'all' | 'active' | 'inactive');
  }

  async deleteCategory(category: Category): Promise<void> {
    const confirmed = await this.notifications.confirm(`¿Estás seguro de eliminar la categoría "${category.name}"?`);
    if (!confirmed) return;

    this.categoriesService.delete(category.id).subscribe({
      next: () => {
        this.categories.update(cats => cats.filter(c => c.id !== category.id));
        this.notifications.success('Categoría eliminada correctamente.');
      },
      error: () => {
        this.notifications.error('Error al eliminar la categoría. Por favor, intenta de nuevo.');
      }
    });
  }
}

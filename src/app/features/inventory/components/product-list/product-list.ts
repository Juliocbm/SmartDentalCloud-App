import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { ProductsService } from '../../services/products.service';
import { CategoriesService } from '../../services/categories.service';
import { Product } from '../../models/product.models';
import { Category } from '../../models/category.models';
import { ROUTES } from '../../../../core/constants/routes.constants';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoggingService } from '../../../../core/services/logging.service';

/**
 * Componente para listar productos de inventario
 */
@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PageHeaderComponent],
  templateUrl: './product-list.html',
  styleUrls: ['./product-list.scss']
})
export class ProductListComponent implements OnInit, OnDestroy {
  private productsService = inject(ProductsService);
  private categoriesService = inject(CategoriesService);
  private notifications = inject(NotificationService);
  private logger = inject(LoggingService);
  private searchSubject = new Subject<string>();

  products = signal<Product[]>([]);
  filteredProducts = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  
  loading = signal(true);
  error = signal<string | null>(null);
  
  searchTerm = signal('');
  filterStatus = signal<'all' | 'active' | 'inactive'>('all');
  filterCategory = signal<string>('all');

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Inventario', route: '/inventory' },
    { label: 'Productos' }
  ];

  ngOnInit(): void {
    this.loadData();
    
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchTerm.set(term);
      this.applyFilters();
    });
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    Promise.all([
      this.productsService.getAll().toPromise(),
      this.categoriesService.getAll(true).toPromise()
    ])
      .then(([products, categories]) => {
        this.products.set(products || []);
        this.categories.set(categories || []);
        this.applyFilters();
        this.loading.set(false);
      })
      .catch(err => {
        this.logger.error('Error loading data:', err);
        this.error.set('Error al cargar productos. Intenta de nuevo.');
        this.loading.set(false);
      });
  }

  applyFilters(): void {
    let filtered = [...this.products()];

    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(product =>
        product.code.toLowerCase().includes(search) ||
        product.name.toLowerCase().includes(search) ||
        (product.description?.toLowerCase().includes(search) ?? false)
      );
    }

    const status = this.filterStatus();
    if (status !== 'all') {
      filtered = filtered.filter(product =>
        status === 'active' ? product.isActive : !product.isActive
      );
    }

    const categoryId = this.filterCategory();
    if (categoryId !== 'all') {
      filtered = filtered.filter(product => product.categoryId === categoryId);
    }

    this.filteredProducts.set(filtered);
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  onStatusFilterChange(value: 'all' | 'active' | 'inactive'): void {
    this.filterStatus.set(value);
    this.applyFilters();
  }

  onCategoryFilterChange(value: string): void {
    this.filterCategory.set(value);
    this.applyFilters();
  }

  async deleteProduct(product: Product): Promise<void> {
    const confirmed = await this.notifications.confirm(`¿Estás seguro de eliminar el producto "${product.name}"?`);
    if (!confirmed) return;

    this.productsService.delete(product.id).subscribe({
      next: () => {
        const updated = this.products().filter(p => p.id !== product.id);
        this.products.set(updated);
        this.applyFilters();
        this.notifications.success('Producto eliminado correctamente.');
      },
      error: () => {
        this.notifications.error('Error al eliminar el producto.');
      }
    });
  }

  /**
   * Determina el nivel de alerta del stock
   */
  getStockAlertLevel(product: Product): 'critical' | 'warning' | 'normal' {
    const currentStock = product.currentStock ?? 0;
    
    if (currentStock <= 0 || currentStock < product.minStock) {
      return 'critical';
    }
    
    if (currentStock <= product.reorderPoint) {
      return 'warning';
    }
    
    return 'normal';
  }

  /**
   * Obtiene el icono según el nivel de alerta
   */
  getStockIcon(product: Product): string {
    const level = this.getStockAlertLevel(product);
    
    switch (level) {
      case 'critical': return 'fa-triangle-exclamation';
      case 'warning': return 'fa-circle-exclamation';
      default: return 'fa-check-circle';
    }
  }

  /**
   * Formatea el costo como moneda
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  }
}

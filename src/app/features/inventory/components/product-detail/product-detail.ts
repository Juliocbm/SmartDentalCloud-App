import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductsService } from '../../services/products.service';
import { Product, PRODUCT_UNITS } from '../../models/product.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent],
  templateUrl: './product-detail.html',
  styleUrls: ['./product-detail.scss']
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productsService = inject(ProductsService);
  private notifications = inject(NotificationService);
  private logger = inject(LoggingService);
  private location = inject(Location);

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Inventario', route: '/inventory/products' },
    { label: 'Productos', route: '/inventory/products' },
    { label: 'Detalle' }
  ];

  product = signal<Product | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProduct(id);
    } else {
      this.error.set('ID de producto no proporcionado');
      this.loading.set(false);
    }
  }

  private loadProduct(id: string): void {
    this.loading.set(true);
    this.productsService.getById(id).subscribe({
      next: (product) => {
        this.product.set(product);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading product:', err);
        this.error.set('Error al cargar el producto');
        this.loading.set(false);
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  editProduct(): void {
    const product = this.product();
    if (!product) return;
    this.router.navigate(['/inventory/products', product.id, 'edit']);
  }

  getUnitLabel(unit: string): string {
    const found = PRODUCT_UNITS.find(u => u.value === unit);
    return found ? found.label : unit;
  }

  getStockStatus(product: Product): { label: string; class: string } {
    const stock = product.currentStock ?? 0;
    if (stock <= 0) return { label: 'Sin stock', class: 'badge-error' };
    if (stock <= product.reorderPoint) return { label: 'Stock bajo', class: 'badge-warning' };
    return { label: 'Normal', class: 'badge-success' };
  }

  formatCurrency(value: number | undefined): string {
    if (value == null) return '—';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }
}

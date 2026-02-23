import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SuppliersService } from '../../services/suppliers.service';
import { Supplier, PAYMENT_TERMS } from '../../models/supplier.models';
import { LoggingService } from '../../../../core/services/logging.service';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { AuditInfoComponent } from '../../../../shared/components/audit-info/audit-info';

@Component({
  selector: 'app-supplier-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent, AuditInfoComponent],
  templateUrl: './supplier-detail.html',
  styleUrls: ['./supplier-detail.scss']
})
export class SupplierDetailComponent implements OnInit {
  showAuditModal = signal(false);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private suppliersService = inject(SuppliersService);
  private logger = inject(LoggingService);
  private location = inject(Location);

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Inventario', route: '/inventory/suppliers' },
    { label: 'Proveedores', route: '/inventory/suppliers' },
    { label: 'Detalle' }
  ];

  supplier = signal<Supplier | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadSupplier(id);
    } else {
      this.error.set('ID de proveedor no proporcionado');
      this.loading.set(false);
    }
  }

  private loadSupplier(id: string): void {
    this.loading.set(true);
    this.suppliersService.getById(id).subscribe({
      next: (supplier) => {
        this.supplier.set(supplier);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading supplier:', err);
        this.error.set('Error al cargar el proveedor');
        this.loading.set(false);
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  editSupplier(): void {
    const sup = this.supplier();
    if (!sup) return;
    this.router.navigate(['/inventory/suppliers', sup.id, 'edit']);
  }

  getPaymentTermLabel(value: string | undefined): string {
    if (!value) return '—';
    const found = PAYMENT_TERMS.find(t => t.value === value);
    return found ? found.label : value;
  }
}

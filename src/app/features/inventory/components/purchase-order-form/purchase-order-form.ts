import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { PurchaseOrdersService } from '../../services/purchase-orders.service';
import { SuppliersService } from '../../services/suppliers.service';
import { ProductsService } from '../../services/products.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { LocationsService } from '../../../settings/services/locations.service';
import { LocationSelectorComponent } from '../../../../shared/components/location-selector/location-selector';
import { PurchaseOrderItemModalComponent, PurchaseOrderItemFormData } from './purchase-order-item-modal';
import { Supplier } from '../../models/supplier.models';
import { Product } from '../../models/product.models';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';

@Component({
  selector: 'app-purchase-order-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PageHeaderComponent, LocationSelectorComponent, PurchaseOrderItemModalComponent],
  templateUrl: './purchase-order-form.html',
  styleUrls: ['./purchase-order-form.scss']
})
export class PurchaseOrderFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private purchaseOrdersService = inject(PurchaseOrdersService);
  private suppliersService = inject(SuppliersService);
  private productsService = inject(ProductsService);
  private logger = inject(LoggingService);
  locationsService = inject(LocationsService);

  selectedLocationId = signal<string | null>(null);
  orderForm!: FormGroup;
  suppliers = signal<Supplier[]>([]);
  products = signal<Product[]>([]);
  
  loadingSuppliers = signal(true);
  loadingProducts = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);

  // Items managed via signals (like prescription pattern)
  items = signal<PurchaseOrderItemFormData[]>([]);

  // Item Modal State
  showItemModal = signal(false);
  editingItemIndex = signal<number | null>(null);
  editingItemData = signal<PurchaseOrderItemFormData | null>(null);

  breadcrumbItems = signal<BreadcrumbItem[]>([
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Inventario', route: '/inventory', icon: 'fa-boxes-stacked' },
    { label: 'Órdenes de Compra', route: '/inventory/purchase-orders' },
    { label: 'Nueva Orden' }
  ]);

  subtotal = computed(() => {
    return this.items().reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
  });

  tax = computed(() => this.subtotal() * 0.16);
  total = computed(() => this.subtotal() + this.tax());

  get isEditingItem(): boolean {
    return this.editingItemIndex() !== null;
  }

  ngOnInit(): void {
    this.initForm();
    this.loadSuppliers();
    this.loadProducts();
  }

  private initForm(): void {
    this.orderForm = this.fb.group({
      supplierId: ['', Validators.required],
      expectedDate: [''],
      notes: ['', Validators.maxLength(1000)]
    });
  }

  private loadSuppliers(): void {
    this.suppliersService.getAll(true).subscribe({
      next: (suppliers) => {
        this.suppliers.set(suppliers);
        this.loadingSuppliers.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading suppliers:', err);
        this.loadingSuppliers.set(false);
      }
    });
  }

  private loadProducts(): void {
    this.productsService.getAll(true).subscribe({
      next: (products) => {
        this.products.set(products);
        this.loadingProducts.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading products:', err);
        this.loadingProducts.set(false);
      }
    });
  }

  // === Item Modal Methods ===

  openAddItemModal(): void {
    this.editingItemIndex.set(null);
    this.editingItemData.set(null);
    this.showItemModal.set(true);
  }

  openEditItemModal(index: number): void {
    this.editingItemIndex.set(index);
    this.editingItemData.set({ ...this.items()[index] });
    this.showItemModal.set(true);
  }

  onItemConfirmed(item: PurchaseOrderItemFormData): void {
    const index = this.editingItemIndex();
    if (index !== null) {
      this.items.update(items => {
        const updated = [...items];
        updated[index] = { ...item };
        return updated;
      });
    } else {
      this.items.update(items => [...items, { ...item }]);
    }
    this.closeItemModal();
  }

  closeItemModal(): void {
    this.showItemModal.set(false);
    this.editingItemIndex.set(null);
    this.editingItemData.set(null);
  }

  removeItem(index: number): void {
    this.items.update(items => items.filter((_, i) => i !== index));
  }

  getItemSubtotal(item: PurchaseOrderItemFormData): number {
    return (item.quantity || 0) * (item.unitCost || 0);
  }

  // === Form Validation & Submit ===

  isFormValid(): boolean {
    return this.orderForm.valid && this.items().length > 0;
  }

  onSubmit(): void {
    if (this.orderForm.invalid) {
      this.orderForm.markAllAsTouched();
      return;
    }

    if (this.items().length === 0) {
      this.error.set('Debes agregar al menos un producto a la orden');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const formValue = this.orderForm.value;
    const request = {
      supplierId: formValue.supplierId,
      locationId: this.selectedLocationId() || undefined,
      expectedDate: formValue.expectedDate || undefined,
      notes: formValue.notes || undefined,
      items: this.items().map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitCost: item.unitCost,
        notes: item.notes || undefined
      }))
    };

    this.purchaseOrdersService.create(request).subscribe({
      next: () => {
        this.router.navigate(['/inventory/purchase-orders']);
      },
      error: (err) => {
        this.logger.error('Error creating purchase order:', err);
        this.error.set(getApiErrorMessage(err));
        this.saving.set(false);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/inventory/purchase-orders']);
  }

  hasError(field: string, error: string): boolean {
    const control = this.orderForm.get(field);
    return !!(control && control.hasError(error) && (control.dirty || control.touched));
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }
}

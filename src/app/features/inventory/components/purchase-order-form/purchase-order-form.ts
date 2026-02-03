import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { PurchaseOrdersService } from '../../services/purchase-orders.service';
import { SuppliersService } from '../../services/suppliers.service';
import { ProductsService } from '../../services/products.service';
import { Supplier } from '../../models/supplier.models';
import { Product } from '../../models/product.models';

@Component({
  selector: 'app-purchase-order-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PageHeaderComponent],
  templateUrl: './purchase-order-form.html',
  styleUrls: ['./purchase-order-form.scss']
})
export class PurchaseOrderFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private purchaseOrdersService = inject(PurchaseOrdersService);
  private suppliersService = inject(SuppliersService);
  private productsService = inject(ProductsService);

  orderForm!: FormGroup;
  suppliers = signal<Supplier[]>([]);
  products = signal<Product[]>([]);
  
  loadingSuppliers = signal(true);
  loadingProducts = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);

  breadcrumbItems = signal<BreadcrumbItem[]>([
    { label: 'Inicio', route: '/dashboard', icon: 'fa-home' },
    { label: 'Inventario', route: '/inventory', icon: 'fa-boxes-stacked' },
    { label: 'Órdenes de Compra', route: '/inventory/purchase-orders' },
    { label: 'Nueva Orden' }
  ]);

  subtotal = computed(() => {
    const items = this.items.value;
    return items.reduce((sum: number, item: any) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitCost = parseFloat(item.unitCost) || 0;
      return sum + (quantity * unitCost);
    }, 0);
  });

  tax = computed(() => this.subtotal() * 0.16);
  total = computed(() => this.subtotal() + this.tax());

  get items(): FormArray {
    return this.orderForm.get('items') as FormArray;
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
      notes: ['', Validators.maxLength(1000)],
      items: this.fb.array([])
    });

    this.addItem();
  }

  private loadSuppliers(): void {
    this.suppliersService.getAll(true).subscribe({
      next: (suppliers) => {
        this.suppliers.set(suppliers);
        this.loadingSuppliers.set(false);
      },
      error: (err) => {
        console.error('Error loading suppliers:', err);
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
        console.error('Error loading products:', err);
        this.loadingProducts.set(false);
      }
    });
  }

  createItemFormGroup(): FormGroup {
    return this.fb.group({
      productId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      unitCost: [0, [Validators.required, Validators.min(0)]],
      notes: ['']
    });
  }

  addItem(): void {
    this.items.push(this.createItemFormGroup());
  }

  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    }
  }

  onProductChange(index: number): void {
    const item = this.items.at(index);
    const productId = item.get('productId')?.value;
    
    if (productId) {
      const product = this.products().find(p => p.id === productId);
      if (product) {
        item.patchValue({
          unitCost: product.unitCost
        });
      }
    }
  }

  getItemSubtotal(index: number): number {
    const item = this.items.at(index);
    const quantity = parseFloat(item.get('quantity')?.value) || 0;
    const unitCost = parseFloat(item.get('unitCost')?.value) || 0;
    return quantity * unitCost;
  }

  getProductName(productId: string): string {
    const product = this.products().find(p => p.id === productId);
    return product ? product.name : '';
  }

  onSubmit(): void {
    if (this.orderForm.invalid) {
      this.orderForm.markAllAsTouched();
      return;
    }

    if (this.items.length === 0) {
      this.error.set('Debes agregar al menos un producto a la orden');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const formValue = this.orderForm.value;
    const request = {
      supplierId: formValue.supplierId,
      expectedDate: formValue.expectedDate || undefined,
      notes: formValue.notes || undefined,
      items: formValue.items.map((item: any) => ({
        productId: item.productId,
        quantity: parseFloat(item.quantity),
        unitCost: parseFloat(item.unitCost),
        notes: item.notes || undefined
      }))
    };

    this.purchaseOrdersService.create(request).subscribe({
      next: () => {
        this.router.navigate(['/inventory/purchase-orders']);
      },
      error: (err) => {
        console.error('Error creating purchase order:', err);
        this.error.set(err.error?.error || 'Error al crear orden de compra');
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

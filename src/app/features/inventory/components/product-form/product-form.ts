import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { ProductsService } from '../../services/products.service';
import { CategoriesService } from '../../services/categories.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { Category } from '../../models/category.models';
import { PRODUCT_UNITS } from '../../models/product.models';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';

interface ProductFormValue {
  code: string;
  name: string;
  description: string;
  categoryId: string;
  unit: string;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  unitCost: number;
  notes: string;
  isActive: boolean;
}

/**
 * Componente para crear y editar productos
 */
@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PageHeaderComponent],
  templateUrl: './product-form.html',
  styleUrls: ['./product-form.scss']
})
export class ProductFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private productsService = inject(ProductsService);
  private categoriesService = inject(CategoriesService);
  private logger = inject(LoggingService);

  productForm!: FormGroup;
  categories = signal<Category[]>([]);
  units = PRODUCT_UNITS;
  
  isEditMode = signal(false);
  productId = signal<string | null>(null);
  loading = signal(false);
  loadingCategories = signal(true);
  error = signal<string | null>(null);

  breadcrumbItems = computed<BreadcrumbItem[]>(() => [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Inventario', route: '/inventory' },
    { label: 'Productos', route: '/inventory/products' },
    { label: this.isEditMode() ? 'Editar' : 'Nuevo' }
  ]);

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
    this.checkEditMode();
  }

  private initForm(): void {
    this.productForm = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(50)]],
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      description: ['', [Validators.maxLength(500)]],
      categoryId: [''],
      unit: ['pz', [Validators.required]],
      minStock: [0, [Validators.required, Validators.min(0)]],
      maxStock: [null],
      reorderPoint: [0, [Validators.required, Validators.min(0)]],
      reorderQuantity: [1, [Validators.required, Validators.min(1)]],
      unitCost: [0, [Validators.required, Validators.min(0)]],
      notes: ['', [Validators.maxLength(1000)]],
      isActive: [true]
    });
  }

  private loadCategories(): void {
    this.loadingCategories.set(true);
    this.categoriesService.getAll(true).subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.loadingCategories.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading categories:', err);
        this.loadingCategories.set(false);
      }
    });
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.productId.set(id);
      this.loadProduct(id);
    }
  }

  private loadProduct(id: string): void {
    this.loading.set(true);
    this.productsService.getById(id).subscribe({
      next: (product) => {
        this.productForm.patchValue({
          code: product.code,
          name: product.name,
          description: product.description || '',
          categoryId: product.categoryId || '',
          unit: product.unit,
          minStock: product.minStock,
          maxStock: product.maxStock,
          reorderPoint: product.reorderPoint,
          reorderQuantity: product.reorderQuantity,
          unitCost: product.unitCost,
          notes: product.notes || '',
          isActive: product.isActive
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading product:', err);
        this.error.set(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.markFormGroupTouched(this.productForm);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const formValue = this.productForm.value as ProductFormValue;
    
    if (this.isEditMode()) {
      this.updateProduct(formValue);
    } else {
      this.createProduct(formValue);
    }
  }

  private createProduct(formValue: ProductFormValue): void {
    const request = {
      code: formValue.code,
      name: formValue.name,
      description: formValue.description || undefined,
      categoryId: formValue.categoryId || undefined,
      unit: formValue.unit,
      minStock: formValue.minStock,
      maxStock: formValue.maxStock || undefined,
      reorderPoint: formValue.reorderPoint,
      reorderQuantity: formValue.reorderQuantity,
      unitCost: formValue.unitCost,
      notes: formValue.notes || undefined
    };

    this.productsService.create(request).subscribe({
      next: (product) => {
        this.router.navigate(['/inventory/products']);
      },
      error: (err) => {
        this.logger.error('Error creating product:', err);
        if (err.status === 409) {
          this.error.set('Ya existe un producto con ese código');
        } else if (err.status === 400) {
          this.error.set('Datos inválidos. Verifica el formulario');
        } else {
          this.error.set(getApiErrorMessage(err));
        }
        this.loading.set(false);
      }
    });
  }

  private updateProduct(formValue: ProductFormValue): void {
    const id = this.productId();
    if (!id) return;

    const request = {
      code: formValue.code,
      name: formValue.name,
      description: formValue.description || undefined,
      categoryId: formValue.categoryId || undefined,
      unit: formValue.unit,
      minStock: formValue.minStock,
      maxStock: formValue.maxStock || undefined,
      reorderPoint: formValue.reorderPoint,
      reorderQuantity: formValue.reorderQuantity,
      unitCost: formValue.unitCost,
      notes: formValue.notes || undefined,
      isActive: formValue.isActive
    };

    this.productsService.update(id, request).subscribe({
      next: () => {
        this.router.navigate(['/inventory/products']);
      },
      error: (err) => {
        this.logger.error('Error updating product:', err);
        if (err.status === 409) {
          this.error.set('Ya existe un producto con ese código');
        } else {
          this.error.set(getApiErrorMessage(err));
        }
        this.loading.set(false);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/inventory/products']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  // Getters para validación en template
  get codeControl() { return this.productForm.get('code'); }
  get nameControl() { return this.productForm.get('name'); }
  get unitControl() { return this.productForm.get('unit'); }
  get minStockControl() { return this.productForm.get('minStock'); }
  get reorderPointControl() { return this.productForm.get('reorderPoint'); }
  get reorderQuantityControl() { return this.productForm.get('reorderQuantity'); }
  get unitCostControl() { return this.productForm.get('unitCost'); }
}

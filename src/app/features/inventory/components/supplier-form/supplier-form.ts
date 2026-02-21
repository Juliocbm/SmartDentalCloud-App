import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { SuppliersService } from '../../services/suppliers.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { PAYMENT_TERMS } from '../../models/supplier.models';

@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PageHeaderComponent],
  templateUrl: './supplier-form.html',
  styleUrls: ['./supplier-form.scss']
})
export class SupplierFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private suppliersService = inject(SuppliersService);
  private logger = inject(LoggingService);

  supplierForm!: FormGroup;
  paymentTerms = PAYMENT_TERMS;
  
  isEditMode = signal(false);
  supplierId = signal<string | null>(null);
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);

  breadcrumbItems = computed<BreadcrumbItem[]>(() => [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Inventario', route: '/inventory', icon: 'fa-boxes-stacked' },
    { label: 'Proveedores', route: '/inventory/suppliers' },
    { label: this.isEditMode() ? 'Editar' : 'Nuevo' }
  ]);

  ngOnInit(): void {
    this.initForm();
    this.checkEditMode();
  }

  private initForm(): void {
    this.supplierForm = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(50)]],
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      contactName: ['', [Validators.maxLength(200)]],
      email: ['', [Validators.email, Validators.maxLength(200)]],
      phone: ['', [Validators.maxLength(50)]],
      address: ['', [Validators.maxLength(500)]],
      taxId: ['', [Validators.maxLength(50)]],
      paymentTerms: [''],
      notes: ['', [Validators.maxLength(1000)]],
      isActive: [true]
    });
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.supplierId.set(id);
      this.loadSupplier(id);
    }
  }

  private loadSupplier(id: string): void {
    this.loading.set(true);
    this.suppliersService.getById(id).subscribe({
      next: (supplier) => {
        this.supplierForm.patchValue({
          code: supplier.code,
          name: supplier.name,
          contactName: supplier.contactName || '',
          email: supplier.email || '',
          phone: supplier.phone || '',
          address: supplier.address || '',
          taxId: supplier.taxId || '',
          paymentTerms: supplier.paymentTerms || '',
          notes: supplier.notes || '',
          isActive: supplier.isActive
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading supplier:', err);
        this.error.set('Error al cargar proveedor');
        this.loading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.supplierForm.invalid) {
      this.supplierForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const formValue = this.supplierForm.value;

    if (this.isEditMode() && this.supplierId()) {
      this.suppliersService.update(this.supplierId()!, formValue).subscribe({
        next: () => {
          this.router.navigate(['/inventory/suppliers']);
        },
        error: (err) => {
          this.logger.error('Error updating supplier:', err);
          this.error.set(err.error?.error || 'Error al actualizar proveedor');
          this.saving.set(false);
        }
      });
    } else {
      this.suppliersService.create(formValue).subscribe({
        next: () => {
          this.router.navigate(['/inventory/suppliers']);
        },
        error: (err) => {
          this.logger.error('Error creating supplier:', err);
          this.error.set(err.error?.error || 'Error al crear proveedor');
          this.saving.set(false);
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/inventory/suppliers']);
  }

  hasError(field: string, error: string): boolean {
    const control = this.supplierForm.get(field);
    return !!(control && control.hasError(error) && (control.dirty || control.touched));
  }

  isFieldInvalid(field: string): boolean {
    const control = this.supplierForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}

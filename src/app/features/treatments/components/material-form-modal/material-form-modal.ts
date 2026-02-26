import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal';
import { ModalComponentBase, ModalRef, ModalConfig } from '../../../../shared/services/modal.service';
import { TreatmentsService } from '../../services/treatments.service';
import { ProductsService } from '../../../inventory/services/products.service';
import { Product } from '../../../inventory/models/product.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { LocationAutocompleteComponent } from '../../../../shared/components/location-autocomplete/location-autocomplete';
import { LocationsService } from '../../../settings/services/locations.service';
import { LocationSummary } from '../../../settings/models/location.models';

export interface MaterialFormModalData {
  treatmentId: string;
}

@Component({
  selector: 'app-material-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, LocationAutocompleteComponent],
  templateUrl: './material-form-modal.html',
  styleUrl: './material-form-modal.scss'
})
export class MaterialFormModalComponent implements ModalComponentBase<MaterialFormModalData, boolean>, OnInit {
  private fb = inject(FormBuilder);
  private treatmentsService = inject(TreatmentsService);
  private productsService = inject(ProductsService);
  private notifications = inject(NotificationService);
  locationsService = inject(LocationsService);

  selectedLocationId = signal<string | null>(null);

  modalData?: MaterialFormModalData;
  modalRef?: ModalRef<MaterialFormModalData, boolean>;
  modalConfig?: ModalConfig<MaterialFormModalData>;

  form!: FormGroup;
  loading = signal(false);
  products = signal<Product[]>([]);
  loadingProducts = signal(false);

  ngOnInit(): void {
    this.form = this.fb.group({
      productId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      unitCost: [0, [Validators.required, Validators.min(0)]],
      notes: ['']
    });

    this.loadProducts();
  }

  private loadProducts(): void {
    this.loadingProducts.set(true);
    this.productsService.getAll(true).subscribe({
      next: (data) => {
        this.products.set(data);
        this.loadingProducts.set(false);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err, 'Error al cargar productos'));
        this.loadingProducts.set(false);
      }
    });
  }

  onProductSelected(): void {
    const productId = this.form.get('productId')?.value;
    const product = this.products().find(p => p.id === productId);
    if (product) {
      this.form.patchValue({ unitCost: product.unitCost || 0 });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const formValue = this.form.value;

    this.treatmentsService.createMaterial(this.modalData!.treatmentId, {
      productId: formValue.productId,
      locationId: this.selectedLocationId() || undefined,
      quantity: formValue.quantity,
      unitCost: formValue.unitCost,
      notes: formValue.notes?.trim() || undefined
    }).subscribe({
      next: () => {
        this.notifications.success('Material agregado correctamente');
        this.modalRef?.close(true);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err, 'Error al guardar material'));
        this.loading.set(false);
      }
    });
  }

  onClose(): void {
    this.modalRef?.close();
  }
}

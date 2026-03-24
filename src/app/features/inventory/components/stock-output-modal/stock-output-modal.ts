import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { ModalComponent } from '../../../../shared/components/modal/modal';
import { ModalRef } from '../../../../shared/services/modal.service';
import { ProductsService } from '../../services/products.service';
import { LocationsService } from '../../../settings/services/locations.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { FormSelectComponent, SelectOption } from '../../../../shared/components/form-select/form-select';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';

export interface StockOutputModalData {
  productId: string;
  locationId?: string | null;
  productCode: string;
  productName: string;
  currentStock: number;
  unit: string;
}

@Component({
  selector: 'app-stock-output-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, FormSelectComponent],
  templateUrl: './stock-output-modal.html',
  styleUrls: ['./stock-output-modal.scss']
})
export class StockOutputModalComponent {
  private fb = inject(FormBuilder);
  private productsService = inject(ProductsService);
  private locationsService = inject(LocationsService);
  private logger = inject(LoggingService);

  modalRef!: ModalRef<StockOutputModalData, boolean>;
  modalData!: StockOutputModalData;

  outputForm!: FormGroup;
  saving = signal(false);
  error = signal<string | null>(null);

  commonReasons: SelectOption[] = [
    'Uso en tratamiento',
    'Venta',
    'Merma o daño',
    'Devolución a proveedor',
    'Muestra / Cortesía',
    'Otro'
  ].map(r => ({ value: r, label: r }));

  locationOptions = computed<SelectOption[]>(() =>
    this.locationsService.locationSummaries().map(l => ({ value: l.id, label: l.name }))
  );

  ngOnInit(): void {
    const needsLocation = !this.modalData.locationId && this.locationsService.hasMultipleLocations();

    this.outputForm = this.fb.group({
      locationId: [this.modalData.locationId || ''],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      reason: ['', Validators.required],
      customReason: [''],
      notes: ['']
    });

    if (needsLocation) {
      this.outputForm.get('locationId')?.setValidators(Validators.required);
    }

    this.outputForm.get('quantity')?.valueChanges.subscribe(value => {
      const qty = parseFloat(value) || 0;
      const qtyControl = this.outputForm.get('quantity');
      if (qty > this.modalData.currentStock) {
        qtyControl?.setErrors({ max: true });
      } else if (qtyControl?.hasError('max')) {
        const errors = { ...qtyControl.errors };
        delete errors['max'];
        qtyControl.setErrors(Object.keys(errors).length ? errors : null);
      }
    });

    this.outputForm.get('reason')?.valueChanges.subscribe(value => {
      const customReasonControl = this.outputForm.get('customReason');
      if (value === 'Otro') {
        customReasonControl?.setValidators([Validators.required, Validators.minLength(3)]);
      } else {
        customReasonControl?.clearValidators();
      }
      customReasonControl?.updateValueAndValidity();
    });
  }

  get newStock(): number {
    const current = this.modalData?.currentStock || 0;
    const quantity = parseFloat(this.outputForm?.get('quantity')?.value) || 0;
    return Math.max(0, current - quantity);
  }

  onSubmit(): void {
    if (this.outputForm.invalid) {
      this.outputForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const formValue = this.outputForm.value;

    this.productsService.recordOutput(this.modalData.productId, {
      productId: this.modalData.productId,
      locationId: formValue.locationId || this.modalData.locationId || null,
      quantity: parseFloat(formValue.quantity),
      reason: formValue.reason === 'Otro' ? formValue.customReason : formValue.reason
    }).subscribe({
      next: () => {
        this.modalRef.close(true);
      },
      error: (err) => {
        this.logger.error('Error recording output:', err);
        this.error.set(getApiErrorMessage(err));
        this.saving.set(false);
      }
    });
  }

  onCancel(): void {
    this.modalRef.close(false);
  }

  hasError(field: string, error: string): boolean {
    const control = this.outputForm.get(field);
    return !!(control && control.hasError(error) && (control.dirty || control.touched));
  }
}

import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { ModalComponent } from '../../../../shared/components/modal/modal';
import { ModalRef, ModalConfig } from '../../../../shared/services/modal.service';
import { StockService } from '../../services/stock.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { StockAdjustmentRequest } from '../../models/stock.models';
import { LocationsService } from '../../../settings/services/locations.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';

/**
 * Datos que recibe el modal de ajuste de stock
 */
export interface StockAdjustmentModalData {
  productId: string;
  locationId?: string | null;
  productCode: string;
  productName: string;
  currentStock: number;
  unit: string;
}

/**
 * Modal para ajustar el stock de un producto.
 * Puede ser invocado desde cualquier componente usando ModalService.
 */
@Component({
  selector: 'app-stock-adjustment-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './stock-adjustment-modal.html',
  styleUrls: ['./stock-adjustment-modal.scss']
})
export class StockAdjustmentModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private stockService = inject(StockService);
  private logger = inject(LoggingService);
  locationsService = inject(LocationsService);

  // Inyectados por ModalService
  modalRef!: ModalRef<StockAdjustmentModalData, boolean>;
  modalData!: StockAdjustmentModalData;
  modalConfig!: ModalConfig<StockAdjustmentModalData>;

  adjustmentForm!: FormGroup;
  saving = signal(false);
  error = signal<string | null>(null);
  showLocationSelector = signal(false);

  adjustmentTypes = [
    { value: 'add', label: 'Entrada (Agregar)', icon: 'fa-plus' },
    { value: 'subtract', label: 'Salida (Restar)', icon: 'fa-minus' }
  ];

  commonReasons = [
    'Ajuste por conteo físico',
    'Merma o daño',
    'Devolución de proveedor',
    'Error de registro anterior',
    'Uso interno',
    'Muestra/Cortesía',
    'Otro'
  ];

  ngOnInit(): void {
    this.showLocationSelector.set(!this.modalData.locationId && this.locationsService.hasMultipleLocations());
    this.initializeForm();
  }

  private initializeForm(): void {
    this.adjustmentForm = this.fb.group({
      adjustmentType: ['add', Validators.required],
      locationId: [this.modalData.locationId || ''],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      reason: ['', Validators.required],
      customReason: [''],
      notes: ['']
    });

    if (this.showLocationSelector()) {
      this.adjustmentForm.get('locationId')?.setValidators(Validators.required);
    }

    // Validar razón personalizada si se selecciona "Otro"
    this.adjustmentForm.get('reason')?.valueChanges.subscribe(value => {
      const customReasonControl = this.adjustmentForm.get('customReason');
      if (value === 'Otro') {
        customReasonControl?.setValidators([Validators.required, Validators.minLength(3)]);
      } else {
        customReasonControl?.clearValidators();
      }
      customReasonControl?.updateValueAndValidity();
    });
  }

  get previewStock(): number {
    const current = this.modalData?.currentStock || 0;
    const quantity = this.adjustmentForm?.get('quantity')?.value || 0;
    const type = this.adjustmentForm?.get('adjustmentType')?.value;

    if (type === 'add') {
      return current + quantity;
    } else {
      return Math.max(0, current - quantity);
    }
  }

  get stockDifference(): number {
    return this.previewStock - (this.modalData?.currentStock || 0);
  }

  onSubmit(): void {
    if (this.adjustmentForm.invalid) {
      this.adjustmentForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const formValue = this.adjustmentForm.value;
    const quantity = formValue.adjustmentType === 'add' 
      ? formValue.quantity 
      : -formValue.quantity;

    const reason = formValue.reason === 'Otro' 
      ? formValue.customReason 
      : formValue.reason;

    const selectedLocationId = this.adjustmentForm.value.locationId || this.modalData.locationId;

    const request: StockAdjustmentRequest = {
      productId: this.modalData.productId,
      locationId: selectedLocationId || null,
      quantity: quantity,
      reason: reason
    };

    this.stockService.adjustStock(request).subscribe({
      next: () => {
        this.modalRef.close(true);
      },
      error: (err) => {
        this.logger.error('Error adjusting stock:', err);
        this.error.set(getApiErrorMessage(err));
        this.saving.set(false);
      }
    });
  }

  onCancel(): void {
    this.modalRef.close(false);
  }

  hasError(field: string, error: string): boolean {
    const control = this.adjustmentForm.get(field);
    return !!(control && control.hasError(error) && (control.dirty || control.touched));
  }
}

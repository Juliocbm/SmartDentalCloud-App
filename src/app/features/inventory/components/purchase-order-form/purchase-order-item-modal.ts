import { Component, signal, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal';
import { Product } from '../../models/product.models';
import { CreatePurchaseOrderItemRequest } from '../../models/purchase-order.models';

export interface PurchaseOrderItemFormData extends CreatePurchaseOrderItemRequest {
  productName?: string;
  productCode?: string;
  unit?: string;
}

@Component({
  selector: 'app-purchase-order-item-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './purchase-order-item-modal.html',
  styleUrl: './purchase-order-item-modal.scss'
})
export class PurchaseOrderItemModalComponent {
  products = input.required<Product[]>();
  isEditing = input(false);
  initialData = input<PurchaseOrderItemFormData | null>(null);

  confirmed = output<PurchaseOrderItemFormData>();
  closed = output<void>();

  itemForm = signal<PurchaseOrderItemFormData>(this.createEmptyItem());

  itemSubtotal = computed(() => {
    const form = this.itemForm();
    return (form.quantity || 0) * (form.unitCost || 0);
  });

  ngOnInit(): void {
    const data = this.initialData();
    if (data) {
      this.itemForm.set({ ...data });
    }
  }

  private createEmptyItem(): PurchaseOrderItemFormData {
    return {
      productId: '',
      quantity: 1,
      unitCost: 0,
      notes: ''
    };
  }

  onProductChange(productId: string): void {
    const product = this.products().find(p => p.id === productId);
    this.itemForm.update(form => ({
      ...form,
      productId,
      productName: product?.name,
      productCode: product?.code,
      unit: product?.unit,
      unitCost: product?.unitCost ?? form.unitCost
    }));
  }

  updateField(field: keyof PurchaseOrderItemFormData, value: string | number): void {
    this.itemForm.update(form => ({ ...form, [field]: value }));
  }

  isItemValid(): boolean {
    const form = this.itemForm();
    return form.productId !== '' && form.quantity > 0 && form.unitCost >= 0;
  }

  onConfirm(): void {
    if (!this.isItemValid()) return;
    this.confirmed.emit({ ...this.itemForm() });
  }

  onClose(): void {
    this.closed.emit();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }
}

import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ModalComponent } from '../modal/modal';
import { ModalComponentBase, ModalRef, ModalConfig } from '../../services/modal.service';
import { QUOTA_METADATA } from '../../../core/constants/quota.constants';

export interface QuotaExceededModalData {
  planName: string;
  resourceType: string;
  currentUsage: number;
  limit: number;
}

@Component({
  selector: 'app-quota-exceeded-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './quota-exceeded-modal.html',
  styleUrl: './quota-exceeded-modal.scss'
})
export class QuotaExceededModalComponent implements ModalComponentBase<QuotaExceededModalData> {
  private router = inject(Router);

  modalData?: QuotaExceededModalData;
  modalRef?: ModalRef<QuotaExceededModalData>;
  modalConfig?: ModalConfig<QuotaExceededModalData>;

  get resourceLabel(): string {
    return QUOTA_METADATA[this.modalData?.resourceType ?? '']?.label ?? this.modalData?.resourceType ?? '';
  }

  get resourceIcon(): string {
    return QUOTA_METADATA[this.modalData?.resourceType ?? '']?.icon ?? 'fa-triangle-exclamation';
  }

  get usagePercent(): number {
    const limit = this.modalData?.limit ?? 0;
    return limit > 0 ? Math.min(((this.modalData?.currentUsage ?? 0) / limit) * 100, 100) : 0;
  }

  goToSubscription(): void {
    this.modalRef?.close();
    this.router.navigate(['/subscription']);
  }

  close(): void {
    this.modalRef?.close();
  }
}

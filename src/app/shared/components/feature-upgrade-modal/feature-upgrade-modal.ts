import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ModalComponent } from '../modal/modal';
import { ModalComponentBase, ModalRef, ModalConfig } from '../../services/modal.service';
import { FeatureService, PlanFeature } from '../../../core/services/feature.service';

export interface FeatureUpgradeModalData {
  feature: PlanFeature;
}

@Component({
  selector: 'app-feature-upgrade-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './feature-upgrade-modal.html',
  styleUrl: './feature-upgrade-modal.scss'
})
export class FeatureUpgradeModalComponent implements ModalComponentBase<FeatureUpgradeModalData> {
  private router = inject(Router);
  private featureService = inject(FeatureService);

  modalData?: FeatureUpgradeModalData;
  modalRef?: ModalRef<FeatureUpgradeModalData>;
  modalConfig?: ModalConfig<FeatureUpgradeModalData>;

  get featureLabel(): string {
    return this.modalData ? this.featureService.getFeatureLabel(this.modalData.feature) : '';
  }

  get minimumPlan(): string {
    return this.modalData ? this.featureService.getMinimumPlan(this.modalData.feature) : '';
  }

  get currentPlan(): string {
    return this.featureService.planName() || 'Básico';
  }

  goToSubscription(): void {
    this.modalRef?.close();
    this.router.navigate(['/subscription']);
  }

  close(): void {
    this.modalRef?.close();
  }
}

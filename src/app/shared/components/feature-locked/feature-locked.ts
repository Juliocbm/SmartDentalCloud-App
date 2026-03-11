import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FeatureService, PlanFeature } from '../../../core/services/feature.service';

@Component({
  selector: 'app-feature-locked',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './feature-locked.html',
  styleUrl: './feature-locked.scss'
})
export class FeatureLockedComponent {
  private router = inject(Router);
  private featureService = inject(FeatureService);

  @Input({ required: true }) feature!: PlanFeature;

  get featureLabel(): string {
    return this.featureService.getFeatureLabel(this.feature);
  }

  get minimumPlan(): string {
    return this.featureService.getMinimumPlan(this.feature);
  }

  get currentPlan(): string {
    return this.featureService.planName() || 'Básico';
  }

  goToSubscription(): void {
    this.router.navigate(['/subscription']);
  }
}

import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { NavigationStateService } from '../../../../core/services/navigation-state.service';

@Component({
  selector: 'app-feature-required',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './feature-required.html',
  styleUrl: './feature-required.scss'
})
export class FeatureRequiredComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private navigationState = inject(NavigationStateService);

  feature = signal('');
  featureLabel = signal('');
  minimumPlan = signal('');
  currentPlan = signal('');
  private returnUrl = '/dashboard';

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;
    if (params['feature']) this.feature.set(params['feature']);
    if (params['featureLabel']) this.featureLabel.set(params['featureLabel']);
    if (params['minimumPlan']) this.minimumPlan.set(params['minimumPlan']);
    if (params['currentPlan']) this.currentPlan.set(params['currentPlan']);

    const lastState = this.navigationState.getState();
    if (lastState?.url) {
      this.returnUrl = lastState.url;
    }
  }

  goToSubscription(): void {
    this.router.navigate(['/subscription']);
  }

  goBack(): void {
    this.router.navigateByUrl(this.returnUrl);
  }
}

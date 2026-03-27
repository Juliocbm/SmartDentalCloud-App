import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { QUOTA_METADATA } from '../../../../core/constants/quota.constants';

@Component({
  selector: 'app-subscription-limit-exceeded',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './subscription-limit-exceeded.html',
  styleUrl: './subscription-limit-exceeded.scss'
})
export class SubscriptionLimitExceededComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  planName = signal('');

  // Quota-based (nuevo formato desde QuotaExceededException)
  resourceType = signal('');
  currentUsage = signal(0);
  limitValue = signal(0);

  // Legacy format (backward compat)
  currentPatients = signal(0);
  patientLimit = signal(0);
  currentUsers = signal(0);
  userLimit = signal(0);

  resourceLabel = computed(() => {
    const rt = this.resourceType();
    return QUOTA_METADATA[rt]?.label ?? rt;
  });

  resourceIcon = computed(() => {
    const rt = this.resourceType();
    return QUOTA_METADATA[rt]?.icon ?? 'fa-triangle-exclamation';
  });

  isQuotaFormat = computed(() => !!this.resourceType());

  usagePercent = computed(() => {
    const limit = this.limitValue();
    return limit > 0 ? Math.min((this.currentUsage() / limit) * 100, 100) : 0;
  });

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;
    if (params['plan']) this.planName.set(params['plan']);

    // Nuevo formato (quota)
    if (params['resourceType']) {
      this.resourceType.set(params['resourceType']);
      if (params['current']) this.currentUsage.set(+params['current']);
      if (params['limit']) this.limitValue.set(+params['limit']);
    }

    // Legacy format
    if (params['patients']) this.currentPatients.set(+params['patients']);
    if (params['patientLimit']) this.patientLimit.set(+params['patientLimit']);
    if (params['users']) this.currentUsers.set(+params['users']);
    if (params['userLimit']) this.userLimit.set(+params['userLimit']);
  }

  goToSubscription(): void {
    this.router.navigate(['/subscription']);
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}

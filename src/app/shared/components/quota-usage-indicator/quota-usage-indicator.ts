import { Component, inject, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EntitlementService } from '../../../core/services/entitlement.service';

@Component({
  selector: 'app-quota-usage-indicator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quota-usage-indicator.html',
  styleUrl: './quota-usage-indicator.scss'
})
export class QuotaUsageIndicatorComponent {
  private entitlementService = inject(EntitlementService);

  quotaKey = input.required<string>();

  quota = computed(() => this.entitlementService.getQuota(this.quotaKey()));
  label = computed(() => this.entitlementService.getQuotaLabel(this.quotaKey()));
  icon = computed(() => this.entitlementService.getQuotaIcon(this.quotaKey()));
}

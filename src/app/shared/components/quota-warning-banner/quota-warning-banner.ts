import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EntitlementService } from '../../../core/services/entitlement.service';

/**
 * Banner de advertencia de quota cercana al límite (>= 80%).
 * Se muestra en las páginas relevantes (pacientes, usuarios, sucursales, archivos).
 *
 * Uso: <app-quota-warning-banner quotaKey="Quota:Patients" />
 * Si no se pasa quotaKey, muestra todas las quotas cerca del límite.
 */
@Component({
  selector: 'app-quota-warning-banner',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './quota-warning-banner.html',
  styleUrl: './quota-warning-banner.scss'
})
export class QuotaWarningBannerComponent {
  private entitlementService = inject(EntitlementService);

  /** Si se especifica, solo muestra warning de esta quota específica */
  quotaKey = input<string | null>(null);

  get warnings() {
    const key = this.quotaKey();
    const allNearLimit = this.entitlementService.nearLimitQuotas();

    if (key) {
      return allNearLimit.filter(q => q.key === key);
    }
    return allNearLimit;
  }
}

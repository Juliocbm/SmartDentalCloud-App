import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SubscriptionsService } from '../../../features/subscriptions/services/subscriptions.service';

/**
 * Banner informativo de período de prueba activo.
 * ON-BUG-002: muestra días restantes de trial en el layout principal.
 * Se oculta automáticamente cuando la suscripción está activa (no es trial).
 */
@Component({
  selector: 'app-trial-banner',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './trial-banner.html',
  styleUrl: './trial-banner.scss'
})
export class TrialBannerComponent implements OnInit {
  private subscriptionsService = inject(SubscriptionsService);

  isTrial = signal(false);
  daysRemaining = signal(0);
  loading = signal(true);

  ngOnInit(): void {
    this.subscriptionsService.getCurrent().subscribe({
      next: (info) => {
        // ON-BUG-002: SubscriptionInfo no tiene isTrial — derivar del status
        this.isTrial.set(info.status === 'Trial');
        // daysRemaining es optional en el modelo — usar 0 como fallback seguro
        this.daysRemaining.set(info.daysRemaining ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  get urgencyClass(): string {
    const days = this.daysRemaining();
    if (days <= 3) return 'trial-banner--urgent';
    if (days <= 7) return 'trial-banner--warning';
    return '';
  }
}

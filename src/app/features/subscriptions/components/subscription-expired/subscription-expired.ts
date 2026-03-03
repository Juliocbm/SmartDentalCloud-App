import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-subscription-expired',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './subscription-expired.html',
  styleUrl: './subscription-expired.scss'
})
export class SubscriptionExpiredComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  status = signal('Expired');
  isTrial = signal(false);
  daysRemaining = signal(0);

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;
    if (params['status']) this.status.set(params['status']);
    if (params['isTrial'] === 'true') this.isTrial.set(true);
    if (params['days']) this.daysRemaining.set(+params['days']);
  }

  goToSubscription(): void {
    this.router.navigate(['/subscription']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}

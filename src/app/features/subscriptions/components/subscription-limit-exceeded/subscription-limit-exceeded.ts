import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';

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
  currentPatients = signal(0);
  patientLimit = signal(0);
  currentUsers = signal(0);
  userLimit = signal(0);

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;
    if (params['plan']) this.planName.set(params['plan']);
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

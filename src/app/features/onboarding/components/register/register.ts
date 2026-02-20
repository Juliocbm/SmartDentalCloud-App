import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { OnboardingService } from '../../services/onboarding.service';
import { RegisterTenantRequest } from '../../models/onboarding.models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class RegisterComponent {
  private onboardingService = inject(OnboardingService);
  private router = inject(Router);

  // Steps
  currentStep = signal(1);
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal(false);

  // Form fields
  tenantName = signal('');
  subdomain = signal('');
  adminName = signal('');
  adminEmail = signal('');
  adminPassword = signal('');
  confirmPassword = signal('');
  timeZone = signal('America/Mexico_City');

  // Validation
  subdomainPreview = signal('');

  onSubdomainInput(value: string): void {
    const clean = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    this.subdomain.set(clean);
    this.subdomainPreview.set(clean ? `${clean}.smartdentalcloud.com` : '');
  }

  canProceedStep1(): boolean {
    return this.tenantName().trim().length > 0
      && this.subdomain().length >= 3;
  }

  canProceedStep2(): boolean {
    return this.adminName().trim().length > 0
      && this.adminEmail().trim().length > 0
      && this.adminPassword().length >= 8
      && this.adminPassword() === this.confirmPassword();
  }

  nextStep(): void {
    if (this.currentStep() < 3) {
      this.currentStep.update(s => s + 1);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(s => s - 1);
    }
  }

  submit(): void {
    if (!this.canProceedStep1() || !this.canProceedStep2()) return;

    this.loading.set(true);
    this.error.set(null);

    const request: RegisterTenantRequest = {
      tenantName: this.tenantName().trim(),
      subdomain: this.subdomain(),
      adminName: this.adminName().trim(),
      adminEmail: this.adminEmail().trim(),
      adminPassword: this.adminPassword(),
      timeZone: this.timeZone()
    };

    this.onboardingService.register(request).subscribe({
      next: (result) => {
        this.loading.set(false);
        this.success.set(true);
        localStorage.setItem('access_token', result.authToken);
        setTimeout(() => this.router.navigate(['/dashboard']), 2000);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err?.error?.message || err?.error?.title || 'Error al registrar. Verifica los datos e intenta de nuevo.';
        this.error.set(msg);
      }
    });
  }
}

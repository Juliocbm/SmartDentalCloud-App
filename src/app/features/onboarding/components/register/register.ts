import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { OnboardingService } from '../../services/onboarding.service';
import { RegisterTenantRequest, SubscriptionPlanDto } from '../../models/onboarding.models';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { FormSelectComponent, SelectOption } from '../../../../shared/components/form-select/form-select';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FormSelectComponent],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class RegisterComponent implements OnInit {
  private onboardingService = inject(OnboardingService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Steps (now 4: Consultorio, Admin, Plan, Confirmar)
  currentStep = signal(1);
  totalSteps = signal(4);
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal(false);

  // Form fields - Step 1
  tenantName = signal('');
  subdomain = signal('');
  timeZone = signal('America/Mexico_City');
  registerTimezoneOptions: SelectOption[] = [
    { value: 'America/Mexico_City', label: 'Ciudad de México (CST)' },
    { value: 'America/Monterrey', label: 'Monterrey (CST)' },
    { value: 'America/Cancun', label: 'Cancún (EST)' },
    { value: 'America/Tijuana', label: 'Tijuana (PST)' },
    { value: 'America/Hermosillo', label: 'Hermosillo (MST)' },
    { value: 'America/Chihuahua', label: 'Chihuahua (MST)' },
    { value: 'America/Mazatlan', label: 'Mazatlán (MST)' }
  ];
  subdomainPreview = signal('');

  // Form fields - Step 2
  adminName = signal('');
  adminEmail = signal('');
  adminPassword = signal('');
  confirmPassword = signal('');

  // Form fields - Step 3 (Plan selection)
  plans = signal<SubscriptionPlanDto[]>([]);
  loadingPlans = signal(false);
  selectedPlanId = signal<string | null>(null);
  startWithTrial = signal(true);

  ngOnInit(): void {
    this.loadPlans();

    // Capturar query params del marketing site
    const params = this.route.snapshot.queryParams;
    if (params['plan']) {
      this.selectedPlanId.set(params['plan']);
    }
    if (params['trial'] === 'false') {
      this.startWithTrial.set(false);
    }
  }

  private loadPlans(): void {
    this.loadingPlans.set(true);
    this.onboardingService.getPlans().subscribe({
      next: (plans) => {
        this.plans.set(plans);
        this.loadingPlans.set(false);
        // Si no hay plan pre-seleccionado, seleccionar el recomendado
        if (!this.selectedPlanId()) {
          const recommended = plans.find(p => p.isRecommended);
          if (recommended) {
            this.selectedPlanId.set(recommended.id);
          } else if (plans.length > 0) {
            this.selectedPlanId.set(plans[0].id);
          }
        }
      },
      error: () => {
        this.loadingPlans.set(false);
      }
    });
  }

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

  canProceedStep3(): boolean {
    return this.selectedPlanId() !== null;
  }

  selectedPlan(): SubscriptionPlanDto | null {
    const id = this.selectedPlanId();
    return this.plans().find(p => p.id === id) ?? null;
  }

  selectPlan(planId: string): void {
    this.selectedPlanId.set(planId);
  }

  nextStep(): void {
    if (this.currentStep() < this.totalSteps()) {
      this.currentStep.update(s => s + 1);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(s => s - 1);
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }

  formatLimit(limit?: number): string {
    if (!limit || limit < 0) return 'Ilimitado';
    return limit.toString();
  }

  submit(): void {
    if (!this.canProceedStep1() || !this.canProceedStep2() || !this.canProceedStep3()) return;

    this.loading.set(true);
    this.error.set(null);

    const request: RegisterTenantRequest = {
      tenantName: this.tenantName().trim(),
      subdomain: this.subdomain(),
      adminName: this.adminName().trim(),
      adminEmail: this.adminEmail().trim(),
      adminPassword: this.adminPassword(),
      timeZone: this.timeZone(),
      planId: this.selectedPlanId() ?? undefined,
      startWithTrial: this.startWithTrial()
    };

    this.onboardingService.register(request).subscribe({
      next: (result) => {
        this.loading.set(false);
        this.success.set(true);
        localStorage.setItem('access_token', result.authToken);
        // Redirect al onboarding wizard en vez del dashboard
        setTimeout(() => this.router.navigate(['/onboarding/welcome']), 2000);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(getApiErrorMessage(err));
      }
    });
  }
}

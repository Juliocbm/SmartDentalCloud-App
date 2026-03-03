import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-onboarding-wizard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './onboarding-wizard.html',
  styleUrl: './onboarding-wizard.scss'
})
export class OnboardingWizardComponent implements OnInit {
  private router = inject(Router);

  currentStep = signal(1);
  totalSteps = 4;

  steps = [
    {
      number: 1,
      title: '¡Bienvenido a SmartDental Cloud!',
      subtitle: 'Tu consultorio digital está listo. Te guiaremos en los primeros pasos.',
      icon: 'fa-hand-sparkles',
      content: 'welcome'
    },
    {
      number: 2,
      title: 'Registra tu primer paciente',
      subtitle: 'Agrega la información básica de un paciente para familiarizarte con el sistema.',
      icon: 'fa-user-plus',
      content: 'first-patient'
    },
    {
      number: 3,
      title: 'Agenda tu primera cita',
      subtitle: 'Programa una cita para ver cómo funciona el calendario.',
      icon: 'fa-calendar-plus',
      content: 'first-appointment'
    },
    {
      number: 4,
      title: '¡Todo listo!',
      subtitle: 'Tu consultorio está configurado y listo para usar.',
      icon: 'fa-circle-check',
      content: 'complete'
    }
  ];

  ngOnInit(): void {
    // Verificar que el usuario está autenticado
    const token = localStorage.getItem('access_token');
    if (!token) {
      this.router.navigate(['/login']);
    }
  }

  get currentStepData() {
    return this.steps[this.currentStep() - 1];
  }

  get progressPercent(): number {
    return (this.currentStep() / this.totalSteps) * 100;
  }

  nextStep(): void {
    if (this.currentStep() < this.totalSteps) {
      this.currentStep.update(s => s + 1);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(s => s - 1);
    }
  }

  skipStep(): void {
    this.nextStep();
  }

  goToPatients(): void {
    this.router.navigate(['/patients'], { queryParams: { action: 'create' } });
  }

  goToAppointments(): void {
    this.router.navigate(['/appointments'], { queryParams: { action: 'create' } });
  }

  finish(): void {
    localStorage.setItem('onboarding_completed', 'true');
    this.router.navigate(['/dashboard']);
  }

  skipAll(): void {
    localStorage.setItem('onboarding_completed', 'true');
    this.router.navigate(['/dashboard']);
  }
}

import { Routes } from '@angular/router';
import { TreatmentPlansService } from './services/treatment-plans.service';

export const TREATMENT_PLANS_ROUTES: Routes = [
  {
    path: '',
    providers: [TreatmentPlansService],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/treatment-plan-list/treatment-plan-list').then(m => m.TreatmentPlanListComponent)
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./components/treatment-plan-dashboard/treatment-plan-dashboard').then(m => m.TreatmentPlanDashboardComponent),
        title: 'Dashboard de Planes de Tratamiento'
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./components/treatment-plan-form/treatment-plan-form').then(m => m.TreatmentPlanFormComponent)
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./components/treatment-plan-detail/treatment-plan-detail').then(m => m.TreatmentPlanDetailComponent)
      }
    ]
  }
];

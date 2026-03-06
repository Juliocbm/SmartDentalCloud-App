import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/auth.guard';
import { PERMISSIONS } from '../../core/services/permission.service';
import { TreatmentPlansService } from './services/treatment-plans.service';
import { PatientsService } from '../patients/services/patients.service';

export const TREATMENT_PLANS_ROUTES: Routes = [
  {
    path: '',
    providers: [TreatmentPlansService, PatientsService],
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
        canActivate: [permissionGuard(PERMISSIONS.TreatmentPlansCreate)],
        loadComponent: () =>
          import('./components/treatment-plan-form/treatment-plan-form').then(m => m.TreatmentPlanFormComponent)
      },
      {
        path: ':id/edit',
        canActivate: [permissionGuard(PERMISSIONS.TreatmentPlansEdit)],
        loadComponent: () =>
          import('./components/treatment-plan-form/treatment-plan-form').then(m => m.TreatmentPlanFormComponent),
        title: 'Editar Plan de Tratamiento'
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./components/treatment-plan-detail/treatment-plan-detail').then(m => m.TreatmentPlanDetailComponent)
      }
    ]
  }
];

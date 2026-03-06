import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/auth.guard';
import { PERMISSIONS } from '../../core/services/permission.service';
import { PatientsAnalyticsService } from './services/patients-analytics.service';

export const PATIENTS_ROUTES: Routes = [
  {
    path: '',
    providers: [PatientsAnalyticsService],
    children: [
      {
        path: '',
        loadComponent: () => import('./components/patient-list/patient-list')
          .then(m => m.PatientListComponent)
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./components/patients-dashboard/patients-dashboard')
          .then(m => m.PatientsDashboardComponent)
      },
      {
        path: 'new',
        canActivate: [permissionGuard(PERMISSIONS.PatientsCreate)],
        loadComponent: () => import('./components/patient-form/patient-form')
          .then(m => m.PatientFormComponent)
      },
      {
        path: 'merge',
        canActivate: [permissionGuard(PERMISSIONS.PatientsEdit)],
        loadComponent: () => import('./components/patient-merge/patient-merge')
          .then(m => m.PatientMergeComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./components/patient-detail/patient-detail')
          .then(m => m.PatientDetailComponent)
      },
      {
        path: ':id/edit',
        canActivate: [permissionGuard(PERMISSIONS.PatientsEdit)],
        loadComponent: () => import('./components/patient-form/patient-form')
          .then(m => m.PatientFormComponent)
      },
      {
        path: ':id/export',
        loadComponent: () => import('./components/clinical-export/clinical-export')
          .then(m => m.ClinicalExportComponent)
      },
      {
        path: ':id/periodontogram/:perioId',
        loadComponent: () => import('../../features/periodontogram/components/periodontogram-page/periodontogram-page')
          .then(m => m.PeriodontogramPageComponent)
      },
      {
        path: ':id/cephalometry/:cephId',
        loadComponent: () => import('../../features/cephalometry/components/cephalometry-page/cephalometry-page')
          .then(m => m.CephalometryPageComponent)
      }
    ]
  }
];

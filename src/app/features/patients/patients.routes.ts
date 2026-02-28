import { Routes } from '@angular/router';
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
        loadComponent: () => import('./components/patient-form/patient-form')
          .then(m => m.PatientFormComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./components/patient-detail/patient-detail')
          .then(m => m.PatientDetailComponent)
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./components/patient-form/patient-form')
          .then(m => m.PatientFormComponent)
      },
      {
        path: ':id/periodontogram/:perioId',
        loadComponent: () => import('../../features/periodontogram/components/periodontogram-page/periodontogram-page')
          .then(m => m.PeriodontogramPageComponent)
      }
    ]
  }
];

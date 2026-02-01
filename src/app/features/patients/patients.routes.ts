import { Routes } from '@angular/router';

export const PATIENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/patient-list/patient-list')
      .then(m => m.PatientListComponent)
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
  }
];

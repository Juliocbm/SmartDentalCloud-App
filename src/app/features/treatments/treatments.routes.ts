import { Routes } from '@angular/router';
import { TreatmentsService } from './services/treatments.service';
import { AppointmentsService } from '../appointments/services/appointments.service';

export const TREATMENTS_ROUTES: Routes = [
  {
    path: '',
    providers: [TreatmentsService, AppointmentsService],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/treatment-list/treatment-list').then(m => m.TreatmentListComponent),
        title: 'Tratamientos'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./components/treatment-dashboard/treatment-dashboard').then(m => m.TreatmentDashboardComponent),
        title: 'Dashboard de Tratamientos'
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./components/treatment-form/treatment-form').then(m => m.TreatmentFormComponent),
        title: 'Nuevo Tratamiento'
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./components/treatment-detail/treatment-detail').then(m => m.TreatmentDetailComponent),
        title: 'Detalle de Tratamiento'
      },
      {
        path: ':id/edit',
        loadComponent: () =>
          import('./components/treatment-form/treatment-form').then(m => m.TreatmentFormComponent),
        title: 'Editar Tratamiento'
      }
    ]
  }
];

import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/auth.guard';
import { PERMISSIONS } from '../../core/services/permission.service';

export const TREATMENTS_ROUTES: Routes = [
  {
    path: '',
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
        canActivate: [permissionGuard(PERMISSIONS.TreatmentsCreate)],
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
        canActivate: [permissionGuard(PERMISSIONS.TreatmentsEdit)],
        loadComponent: () =>
          import('./components/treatment-form/treatment-form').then(m => m.TreatmentFormComponent),
        title: 'Editar Tratamiento'
      }
    ]
  }
];

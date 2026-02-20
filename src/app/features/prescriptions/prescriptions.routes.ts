import { Routes } from '@angular/router';
import { PrescriptionsService } from './services/prescriptions.service';

export const PRESCRIPTIONS_ROUTES: Routes = [
  {
    path: '',
    providers: [PrescriptionsService],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/prescription-list/prescription-list').then(m => m.PrescriptionListComponent),
        title: 'Recetas Médicas'
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./components/prescription-form/prescription-form').then(m => m.PrescriptionFormComponent),
        title: 'Nueva Receta'
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./components/prescription-detail/prescription-detail').then(m => m.PrescriptionDetailComponent),
        title: 'Detalle de Receta'
      }
    ]
  }
];

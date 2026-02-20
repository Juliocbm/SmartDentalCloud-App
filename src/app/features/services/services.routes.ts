import { Routes } from '@angular/router';
import { ServicesService } from './services/services.service';

export const SERVICES_ROUTES: Routes = [
  {
    path: '',
    providers: [ServicesService],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/service-list/service-list').then(m => m.ServiceListComponent),
        title: 'Catálogo de Servicios'
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./components/service-form/service-form').then(m => m.ServiceFormComponent),
        title: 'Nuevo Servicio'
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./components/service-detail/service-detail').then(m => m.ServiceDetailComponent),
        title: 'Detalle de Servicio'
      },
      {
        path: ':id/edit',
        loadComponent: () =>
          import('./components/service-form/service-form').then(m => m.ServiceFormComponent),
        title: 'Editar Servicio'
      }
    ]
  }
];

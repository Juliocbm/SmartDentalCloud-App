import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/auth.guard';
import { PERMISSIONS } from '../../core/services/permission.service';
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
        title: 'Servicios'
      },
      {
        path: 'new',
        canActivate: [permissionGuard(PERMISSIONS.TreatmentsCreate)],
        loadComponent: () =>
          import('./components/service-form/service-form').then(m => m.ServiceFormComponent),
        title: 'Nuevo Servicio'
      },
      {
        path: 'categories',
        canActivate: [permissionGuard(PERMISSIONS.TreatmentsView)],
        loadComponent: () =>
          import('./components/category-list/category-list').then(m => m.CategoryListComponent),
        title: 'Categorías de Servicios'
      },
      {
        path: 'categories/new',
        canActivate: [permissionGuard(PERMISSIONS.TreatmentsCreate)],
        loadComponent: () =>
          import('./components/category-form/category-form').then(m => m.CategoryFormComponent),
        title: 'Nueva Categoría'
      },
      {
        path: 'categories/:id/edit',
        canActivate: [permissionGuard(PERMISSIONS.TreatmentsEdit)],
        loadComponent: () =>
          import('./components/category-form/category-form').then(m => m.CategoryFormComponent),
        title: 'Editar Categoría'
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./components/service-detail/service-detail').then(m => m.ServiceDetailComponent),
        title: 'Detalle de Servicio'
      },
      {
        path: ':id/edit',
        canActivate: [permissionGuard(PERMISSIONS.TreatmentsEdit)],
        loadComponent: () =>
          import('./components/service-form/service-form').then(m => m.ServiceFormComponent),
        title: 'Editar Servicio'
      }
    ]
  }
];

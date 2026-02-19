import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent)
  },
  {
    path: '',
    loadComponent: () => import('./shared/components/layout/layout').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
      },
      {
        path: 'patients',
        loadChildren: () => import('./features/patients/patients.routes').then(m => m.PATIENTS_ROUTES)
      },
      {
        path: 'appointments',
        loadChildren: () => import('./features/appointments/appointments.routes').then(m => m.APPOINTMENTS_ROUTES)
      },
      {
        path: 'treatments',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon').then(m => m.ComingSoonComponent),
        data: { moduleName: 'Tratamientos', icon: 'fa-tooth' }
      },
      {
        path: 'billing',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon').then(m => m.ComingSoonComponent),
        data: { moduleName: 'Facturación', icon: 'fa-file-invoice-dollar' }
      },
      {
        path: 'dentists',
        loadComponent: () => import('./features/users/components/dentist-list/dentist-list').then(m => m.DentistListComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon').then(m => m.ComingSoonComponent),
        data: { moduleName: 'Reportes', icon: 'fa-chart-bar' }
      },
      {
        path: 'users',
        loadChildren: () => import('./features/users/users.routes').then(m => m.USERS_ROUTES)
      },
      {
        path: 'inventory',
        loadChildren: () => import('./features/inventory/inventory.routes').then(m => m.INVENTORY_ROUTES)
      },
      {
        path: 'settings',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon').then(m => m.ComingSoonComponent),
        data: { moduleName: 'Configuración', icon: 'fa-gear' }
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];

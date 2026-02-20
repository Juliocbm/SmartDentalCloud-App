import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/auth/reset-password/reset-password').then(m => m.ResetPasswordComponent)
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
        loadChildren: () => import('./features/treatments/treatments.routes').then(m => m.TREATMENTS_ROUTES)
      },
      {
        path: 'services',
        loadChildren: () => import('./features/services/services.routes').then(m => m.SERVICES_ROUTES)
      },
      {
        path: 'treatment-plans',
        loadChildren: () => import('./features/treatment-plans/treatment-plans.routes').then(m => m.TREATMENT_PLANS_ROUTES)
      },
      {
        path: 'invoices',
        loadChildren: () => import('./features/invoices/invoices.routes').then(m => m.INVOICES_ROUTES)
      },
      {
        path: 'payments',
        loadChildren: () => import('./features/payments/payments.routes').then(m => m.PAYMENTS_ROUTES)
      },
      {
        path: 'prescriptions',
        loadChildren: () => import('./features/prescriptions/prescriptions.routes').then(m => m.PRESCRIPTIONS_ROUTES)
      },
      {
        path: 'dentists',
        loadComponent: () => import('./features/users/components/dentist-list/dentist-list').then(m => m.DentistListComponent)
      },
      {
        path: 'reports',
        loadChildren: () => import('./features/reports/reports.routes').then(m => m.REPORTS_ROUTES)
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
      },
      {
        path: 'change-password',
        loadComponent: () => import('./features/auth/change-password/change-password').then(m => m.ChangePasswordComponent),
        title: 'Cambiar Contraseña'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];

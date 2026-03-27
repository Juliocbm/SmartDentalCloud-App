import { Routes } from '@angular/router';
import { authGuard, permissionGuard } from './core/guards/auth.guard';
import { forceChangePasswordGuard } from './core/guards/force-change-password.guard';
import { featureGuard } from './core/guards/feature.guard';
import { featuresLoaderGuard } from './core/guards/features-loader.guard';
import { PERMISSIONS } from './core/services/permission.service';

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
    path: 'register',
    loadComponent: () => import('./features/onboarding/components/register/register').then(m => m.RegisterComponent),
    title: 'Registrar Consultorio'
  },
  {
    path: 'onboarding/welcome',
    loadComponent: () => import('./features/onboarding/components/onboarding-wizard/onboarding-wizard').then(m => m.OnboardingWizardComponent),
    title: 'Bienvenido - SmartDental Cloud'
  },
  {
    path: 'subscription/expired',
    loadComponent: () => import('./features/subscriptions/components/subscription-expired/subscription-expired').then(m => m.SubscriptionExpiredComponent),
    title: 'Suscripción Expirada'
  },
  {
    path: 'subscription/limit-exceeded',
    loadComponent: () => import('./features/subscriptions/components/subscription-limit-exceeded/subscription-limit-exceeded').then(m => m.SubscriptionLimitExceededComponent),
    title: 'Límite de Plan Excedido'
  },
  {
    path: 'subscription/feature-required',
    loadComponent: () => import('./features/subscriptions/components/feature-required/feature-required').then(m => m.FeatureRequiredComponent),
    title: 'Función No Disponible'
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./features/auth/unauthorized/unauthorized').then(m => m.UnauthorizedComponent),
    title: 'Acceso Denegado'
  },
  {
    path: 'force-change-password',
    loadComponent: () => import('./features/auth/force-change-password/force-change-password').then(m => m.ForceChangePasswordComponent),
    canActivate: [authGuard],
    title: 'Cambiar Contraseña'
  },
  {
    path: '',
    loadComponent: () => import('./shared/components/layout/layout').then(m => m.LayoutComponent),
    canActivate: [authGuard, forceChangePasswordGuard, featuresLoaderGuard],
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
        canActivate: [permissionGuard(PERMISSIONS.PatientsView)],
        loadChildren: () => import('./features/patients/patients.routes').then(m => m.PATIENTS_ROUTES)
      },
      {
        path: 'appointments',
        canActivate: [permissionGuard(PERMISSIONS.AppointmentsView)],
        loadChildren: () => import('./features/appointments/appointments.routes').then(m => m.APPOINTMENTS_ROUTES)
      },
      {
        path: 'treatments',
        canActivate: [permissionGuard(PERMISSIONS.TreatmentsView)],
        loadChildren: () => import('./features/treatments/treatments.routes').then(m => m.TREATMENTS_ROUTES)
      },
      {
        path: 'services',
        canActivate: [permissionGuard(PERMISSIONS.TreatmentsView)],
        loadChildren: () => import('./features/services/services.routes').then(m => m.SERVICES_ROUTES)
      },
      {
        path: 'treatment-plans',
        canActivate: [permissionGuard(PERMISSIONS.TreatmentPlansView), featureGuard('TreatmentPlans')],
        loadChildren: () => import('./features/treatment-plans/treatment-plans.routes').then(m => m.TREATMENT_PLANS_ROUTES)
      },
      {
        path: 'invoices',
        canActivate: [permissionGuard(PERMISSIONS.InvoicesView)],
        loadChildren: () => import('./features/invoices/invoices.routes').then(m => m.INVOICES_ROUTES)
      },
      {
        path: 'payments',
        canActivate: [permissionGuard(PERMISSIONS.PaymentsView)],
        loadChildren: () => import('./features/payments/payments.routes').then(m => m.PAYMENTS_ROUTES)
      },
      {
        path: 'prescriptions',
        canActivate: [permissionGuard(PERMISSIONS.PrescriptionsView)],
        loadChildren: () => import('./features/prescriptions/prescriptions.routes').then(m => m.PRESCRIPTIONS_ROUTES)
      },
      {
        path: 'consultation-notes',
        canActivate: [permissionGuard(PERMISSIONS.ConsultationNotesView)],
        loadChildren: () => import('./features/consultation-notes/consultation-notes.routes').then(m => m.CONSULTATION_NOTES_ROUTES),
        title: 'Notas de Consulta'
      },
      {
        path: 'dentists',
        canActivate: [permissionGuard(PERMISSIONS.UsersView)],
        loadChildren: () => import('./features/users/dentists.routes').then(m => m.DENTISTS_ROUTES)
      },
      {
        path: 'reports',
        canActivate: [permissionGuard(PERMISSIONS.ReportsView), featureGuard('AdvancedReports')],
        loadChildren: () => import('./features/reports/reports.routes').then(m => m.REPORTS_ROUTES)
      },
      {
        path: 'users',
        canActivate: [permissionGuard(PERMISSIONS.UsersView)],
        loadChildren: () => import('./features/users/users.routes').then(m => m.USERS_ROUTES)
      },
      {
        path: 'inventory',
        canActivate: [permissionGuard(PERMISSIONS.InventoryView), featureGuard('Inventory')],
        loadChildren: () => import('./features/inventory/inventory.routes').then(m => m.INVENTORY_ROUTES)
      },
      {
        path: 'settings',
        canActivate: [permissionGuard(PERMISSIONS.SettingsView)],
        loadChildren: () => import('./features/settings/settings.routes').then(m => m.SETTINGS_ROUTES)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/users/components/my-profile/my-profile').then(m => m.MyProfileComponent),
        title: 'Mi Perfil'
      },
      {
        path: 'subscription',
        loadComponent: () => import('./features/subscriptions/components/subscription-page/subscription-page').then(m => m.SubscriptionPageComponent),
        title: 'Suscripción'
      },
      {
        path: 'change-password',
        loadComponent: () => import('./features/auth/change-password/change-password').then(m => m.ChangePasswordComponent),
        title: 'Cambiar Contraseña'
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/notifications/components/notification-list/notification-list').then(m => m.NotificationListComponent),
        title: 'Notificaciones'
      },
      {
        path: 'notification-center',
        canActivate: [permissionGuard(PERMISSIONS.NotificationsView)],
        loadChildren: () => import('./features/notification-center/notification-center.routes').then(m => m.NOTIFICATION_CENTER_ROUTES)
      },
      {
        path: 'messaging',
        redirectTo: 'notification-center',
        pathMatch: 'full'
      },
      {
        path: 'audit-log',
        canActivate: [featureGuard('AuditLog')],
        loadComponent: () => import('./features/audit-log/components/audit-log-list/audit-log-list').then(m => m.AuditLogListComponent),
        title: 'Auditoría'
      },
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];

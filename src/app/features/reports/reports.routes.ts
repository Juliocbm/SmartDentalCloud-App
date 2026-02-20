import { Routes } from '@angular/router';

export const REPORTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/reports-dashboard/reports-dashboard').then(m => m.ReportsDashboardComponent),
    title: 'Reportes'
  },
  {
    path: 'accounts-receivable',
    loadComponent: () => import('./components/accounts-receivable/accounts-receivable').then(m => m.AccountsReceivableComponent),
    title: 'Cuentas por Cobrar'
  }
];

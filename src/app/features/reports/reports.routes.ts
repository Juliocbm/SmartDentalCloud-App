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
  },
  {
    path: 'income',
    loadComponent: () => import('./components/income-report/income-report').then(m => m.IncomeReportComponent),
    title: 'Reporte de Ingresos'
  },
  {
    path: 'treatments',
    loadComponent: () => import('./components/treatments-report/treatments-report').then(m => m.TreatmentsReportComponent),
    title: 'Reporte de Tratamientos'
  },
  {
    path: 'dentist-productivity',
    loadComponent: () => import('./components/dentist-productivity/dentist-productivity').then(m => m.DentistProductivityComponent),
    title: 'Productividad por Dentista'
  }
];

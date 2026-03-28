import { DashboardWidgetConfig } from '../../../../../core/models/dashboard-preferences.models';

export const INVOICES_DASHBOARD_WIDGETS: DashboardWidgetConfig = {
  dashboardId: 'invoices',
  widgets: [
    { id: 'kpis', label: 'Métricas de facturación', icon: 'fa-chart-line', defaultVisible: true, reorderable: false },
    { id: 'status-chart', label: 'Facturas por estado', icon: 'fa-chart-pie', defaultVisible: true },
    { id: 'accounts-receivable', label: 'Cuentas por cobrar', icon: 'fa-hand-holding-dollar', defaultVisible: true },
    { id: 'recent-invoices', label: 'Facturas recientes', icon: 'fa-file-invoice', defaultVisible: true },
  ]
};

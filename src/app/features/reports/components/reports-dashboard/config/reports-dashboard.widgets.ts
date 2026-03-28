import { DashboardWidgetConfig } from '../../../../../core/models/dashboard-preferences.models';

export const REPORTS_DASHBOARD_WIDGETS: DashboardWidgetConfig = {
  dashboardId: 'reports',
  widgets: [
    { id: 'report-cards', label: 'Tarjetas de reportes', icon: 'fa-chart-bar', defaultVisible: true, reorderable: false },
  ]
};

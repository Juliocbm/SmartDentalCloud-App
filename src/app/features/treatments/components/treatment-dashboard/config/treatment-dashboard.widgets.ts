import { DashboardWidgetConfig } from '../../../../../core/models/dashboard-preferences.models';

export const TREATMENT_DASHBOARD_WIDGETS: DashboardWidgetConfig = {
  dashboardId: 'treatments',
  widgets: [
    { id: 'kpis', label: 'Métricas de tratamientos', icon: 'fa-chart-line', defaultVisible: true, reorderable: false },
    { id: 'active-treatments', label: 'Tratamientos activos', icon: 'fa-tooth', defaultVisible: true },
    { id: 'recent-treatments', label: 'Tratamientos recientes', icon: 'fa-clock', defaultVisible: true },
    { id: 'status-chart', label: 'Distribución por estado', icon: 'fa-chart-pie', defaultVisible: true },
    { id: 'monthly-trend', label: 'Tendencia mensual', icon: 'fa-chart-line', defaultVisible: true },
  ]
};

import { DashboardWidgetConfig } from '../../../../../core/models/dashboard-preferences.models';

export const DENTIST_DASHBOARD_WIDGETS: DashboardWidgetConfig = {
  dashboardId: 'dentists',
  widgets: [
    { id: 'kpis', label: 'Métricas del equipo', icon: 'fa-chart-line', defaultVisible: true, reorderable: false },
    { id: 'individual-metrics', label: 'Métricas individuales', icon: 'fa-user-doctor', defaultVisible: true, reorderable: false },
    { id: 'revenue-chart', label: 'Ingresos por dentista', icon: 'fa-chart-bar', defaultVisible: true, feature: 'AdvancedReports', group: 'charts' },
    { id: 'appointments-chart', label: 'Citas por dentista', icon: 'fa-chart-bar', defaultVisible: true, feature: 'AdvancedReports', group: 'charts' },
    { id: 'top-revenue', label: 'Top por ingresos', icon: 'fa-ranking-star', defaultVisible: true, feature: 'AdvancedReports', group: 'rankings' },
    { id: 'top-treatments', label: 'Top por tratamientos', icon: 'fa-trophy', defaultVisible: true, feature: 'AdvancedReports', group: 'rankings' },
    { id: 'team-list', label: 'Equipo de dentistas', icon: 'fa-users', defaultVisible: true, group: 'rankings' },
  ]
};

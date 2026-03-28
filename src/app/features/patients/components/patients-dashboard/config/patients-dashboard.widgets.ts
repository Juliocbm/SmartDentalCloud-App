import { DashboardWidgetConfig } from '../../../../../core/models/dashboard-preferences.models';

export const PATIENTS_DASHBOARD_WIDGETS: DashboardWidgetConfig = {
  dashboardId: 'patients',
  widgets: [
    { id: 'kpis', label: 'Métricas de pacientes', icon: 'fa-chart-line', defaultVisible: true, reorderable: false },
    { id: 'age-distribution', label: 'Distribución por edad', icon: 'fa-chart-bar', defaultVisible: true, group: 'charts' },
    { id: 'monthly-new', label: 'Nuevos por mes', icon: 'fa-chart-bar', defaultVisible: true, group: 'charts' },
    { id: 'alerts', label: 'Alertas', icon: 'fa-bell', defaultVisible: true, group: 'lists' },
    { id: 'recent-patients', label: 'Pacientes recientes', icon: 'fa-user-clock', defaultVisible: true, group: 'lists' },
    { id: 'birthdays', label: 'Cumpleaños del mes', icon: 'fa-cake-candles', defaultVisible: true, group: 'lists' },
  ]
};

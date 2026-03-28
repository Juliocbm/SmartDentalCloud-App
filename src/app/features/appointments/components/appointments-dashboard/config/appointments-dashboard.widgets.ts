import { DashboardWidgetConfig } from '../../../../../core/models/dashboard-preferences.models';

export const APPOINTMENTS_DASHBOARD_WIDGETS: DashboardWidgetConfig = {
  dashboardId: 'appointments',
  widgets: [
    { id: 'kpis', label: 'Métricas de citas', icon: 'fa-chart-line', defaultVisible: true, reorderable: false },
    { id: 'upcoming-today', label: 'Próximas citas hoy', icon: 'fa-clock', defaultVisible: true, group: 'lists' },
    { id: 'unconfirmed', label: 'Sin confirmar', icon: 'fa-question-circle', defaultVisible: true, group: 'lists' },
    { id: 'frequent-patients', label: 'Pacientes frecuentes', icon: 'fa-users', defaultVisible: true, group: 'lists' },
    { id: 'status-chart', label: 'Citas por estado', icon: 'fa-chart-pie', defaultVisible: true, group: 'charts' },
    { id: 'weekday-chart', label: 'Citas por día', icon: 'fa-chart-bar', defaultVisible: true, group: 'charts' },
    { id: 'recent-activity', label: 'Actividad reciente', icon: 'fa-history', defaultVisible: true, group: 'charts' },
  ]
};

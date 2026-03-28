import { DashboardWidgetConfig } from '../../../../../core/models/dashboard-preferences.models';

export const TREATMENT_PLAN_DASHBOARD_WIDGETS: DashboardWidgetConfig = {
  dashboardId: 'treatment-plans',
  widgets: [
    { id: 'kpis', label: 'Métricas de planes', icon: 'fa-chart-line', defaultVisible: true, reorderable: false },
    { id: 'pending-approval', label: 'Pendientes de aprobación', icon: 'fa-clipboard-list', defaultVisible: true },
    { id: 'active-plans', label: 'Planes activos', icon: 'fa-spinner', defaultVisible: true },
    { id: 'recent-plans', label: 'Planes recientes', icon: 'fa-clock', defaultVisible: true },
  ]
};

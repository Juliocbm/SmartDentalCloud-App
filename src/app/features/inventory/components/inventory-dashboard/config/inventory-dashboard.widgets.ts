import { DashboardWidgetConfig } from '../../../../../core/models/dashboard-preferences.models';

export const INVENTORY_DASHBOARD_WIDGETS: DashboardWidgetConfig = {
  dashboardId: 'inventory',
  widgets: [
    { id: 'kpis', label: 'Métricas de inventario', icon: 'fa-chart-line', defaultVisible: true, reorderable: false },
    { id: 'category-distribution', label: 'Distribución por categorías', icon: 'fa-chart-pie', defaultVisible: true, group: 'charts' },
    { id: 'top-usage', label: 'Top productos por uso', icon: 'fa-chart-bar', defaultVisible: true, group: 'charts' },
    { id: 'expiring-soon', label: 'Próximos a vencer', icon: 'fa-clock', defaultVisible: true, group: 'lists' },
    { id: 'most-used', label: 'Productos más utilizados', icon: 'fa-arrow-trend-up', defaultVisible: true, group: 'lists' },
    { id: 'recent-activity', label: 'Actividad reciente', icon: 'fa-history', defaultVisible: true, group: 'lists' },
  ]
};

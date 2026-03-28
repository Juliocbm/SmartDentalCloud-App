import { DashboardWidgetConfig } from '../../../core/models/dashboard-preferences.models';
import { PERMISSIONS } from '../../../core/services/permission.service';

export const MAIN_DASHBOARD_WIDGETS: DashboardWidgetConfig = {
  dashboardId: 'main',
  widgets: [
    { id: 'kpis', label: 'Métricas principales', icon: 'fa-chart-line', defaultVisible: true, reorderable: false },
    { id: 'quick-actions', label: 'Acciones rápidas', icon: 'fa-bolt', defaultVisible: true, reorderable: false },
    { id: 'upcoming-appointments', label: 'Próximas citas', icon: 'fa-calendar-days', defaultVisible: true, permission: PERMISSIONS.AppointmentsView },
    { id: 'pending-plans', label: 'Planes por aprobar', icon: 'fa-clipboard-list', defaultVisible: true, permission: PERMISSIONS.TreatmentPlansView, feature: 'TreatmentPlans' },
    { id: 'inventory-alerts', label: 'Alertas de inventario', icon: 'fa-triangle-exclamation', defaultVisible: true, permission: PERMISSIONS.InventoryView, feature: 'Inventory' },
  ]
};

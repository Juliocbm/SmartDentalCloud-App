/**
 * Modelos de datos para el Dashboard Principal
 * Interfaces ligeras que reflejan las respuestas reales del API
 */

export interface DashboardData {
  todayAppointments: DashboardAppointment[];
  upcomingAppointments: DashboardAppointment[];
  treatments: DashboardTreatment[];
  treatmentPlans: DashboardTreatmentPlan[];
  income: DashboardIncome;
  inventory: DashboardInventory;
}

export interface DashboardAppointment {
  id: string;
  patientName: string;
  patientId: string;
  doctorName?: string;
  startAt: string;
  endAt: string;
  reason?: string;
  status: string;
}

export interface DashboardTreatment {
  id: string;
  patientName?: string;
  serviceName?: string;
  status: string;
  startDate: string;
}

export interface DashboardTreatmentPlan {
  id: string;
  patientName?: string;
  title: string;
  planNumber: string;
  status: string;
  totalEstimatedCost: number;
  totalItems: number;
  completedItems: number;
  overallProgressPercentage: number;
  createdAt: string;
}

export interface DashboardIncome {
  totalIncome: number;
  totalPending: number;
  invoiceCount: number;
  paymentCount: number;
}

export interface DashboardInventory {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  lowStockItems: DashboardLowStockItem[];
}

export interface DashboardLowStockItem {
  productId: string;
  productName: string;
  categoryName?: string;
  currentStock: number;
  minimumStock: number;
}

export interface QuickAction {
  label: string;
  description: string;
  icon: string;
  route: string;
  color: string;
}

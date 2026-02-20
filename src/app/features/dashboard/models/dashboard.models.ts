/**
 * Modelos de datos para el Dashboard
 */

export interface DashboardStats {
  todayAppointments: number;
  todayRevenue: number;
  newPatientsThisMonth: number;
  completedTreatmentsThisMonth: number;
  pendingAppointments: number;
  lowStockProducts: number;
  activeTreatmentPlans: number;
  monthlyRevenue: number;
}

export interface RevenueChartData {
  month: string;
  revenue: number;
}

export interface AppointmentStats {
  scheduled: number;
  completed: number;
  cancelled: number;
  noShow: number;
}

export interface UpcomingAppointment {
  id: string;
  patientName: string;
  patientId: string;
  doctorName?: string;
  startAt: Date;
  endAt: Date;
  reason: string;
  status: string;
}

export interface RecentActivity {
  id: string;
  type: 'appointment' | 'treatment' | 'payment' | 'patient';
  description: string;
  timestamp: Date;
  icon: string;
  statusColor: string;
}

export interface QuickStat {
  label: string;
  value: number | string;
  icon: string;
  color: string;
  trend?: number;
  trendDirection?: 'up' | 'down' | 'neutral';
  route?: string;
}

export interface LowStockProduct {
  id: string;
  name: string;
  currentStock: number;
  minStock: number;
  category: string;
}

export interface MonthlyRevenueData {
  labels: string[];
  data: number[];
}

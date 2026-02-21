/**
 * Interfaces para Reportes
 * API: /api/reports
 */

export interface AccountsReceivableItem {
  invoiceId: string;
  patientId: string;
  patientName: string;
  invoiceNumber?: string;
  issuedAt: Date;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: string;
  lastPaymentDate?: Date;
  daysOverdue: number;
}

export interface AccountsReceivableSummary {
  totalBalance: number;
  totalOverdue: number;
  totalInvoices: number;
  overdueInvoices: number;
}

export interface IncomeReport {
  totalIncome: number;
  totalPending: number;
  invoiceCount: number;
  paymentCount: number;
  dailyBreakdown: IncomeByDay[];
}

export interface IncomeByDay {
  date: string;
  amount: number;
  count: number;
}

export interface TreatmentsSummary {
  total: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  onHold: number;
  completionRate: number;
  byType: TreatmentsByType[];
}

export interface TreatmentsByType {
  serviceName: string;
  count: number;
  revenue: number;
}

export interface DentistProductivity {
  dentistId: string;
  dentistName: string;
  appointmentsCompleted: number;
  appointmentsCancelled: number;
  treatmentsCompleted: number;
  revenueGenerated: number;
  avgAppointmentDuration: number;
}

export interface InventorySummary {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalValuation: number;
  lowStockItems: LowStockItem[];
  byCategory: CategoryStock[];
}

export interface LowStockItem {
  productId: string;
  productName: string;
  categoryName?: string;
  currentStock: number;
  minimumStock: number;
  unitCost: number;
}

export interface CategoryStock {
  categoryName: string;
  productCount: number;
  totalStock: number;
  totalValue: number;
}

export interface AppointmentOccupancy {
  totalSlots: number;
  bookedSlots: number;
  completedSlots: number;
  cancelledSlots: number;
  noShowSlots: number;
  occupancyRate: number;
  completionRate: number;
  byDentist: OccupancyByDentist[];
  byDay: OccupancyByDay[];
}

export interface OccupancyByDentist {
  dentistId: string;
  dentistName: string;
  totalAppointments: number;
  completed: number;
  cancelled: number;
  occupancyRate: number;
}

export interface OccupancyByDay {
  dayOfWeek: string;
  totalAppointments: number;
  completed: number;
  avgPerDay: number;
}

export interface TopService {
  serviceId: string;
  serviceName: string;
  categoryName?: string;
  timesUsed: number;
  totalRevenue: number;
  avgPrice: number;
}

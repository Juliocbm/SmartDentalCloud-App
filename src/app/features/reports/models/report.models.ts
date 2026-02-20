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

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

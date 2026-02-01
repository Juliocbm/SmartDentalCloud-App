import { Patient } from './patient.models';

export interface PatientDashboard {
  patient: Patient;
  statistics: PatientStatistics;
  recentAppointments: AppointmentSummary[];
  activeTreatments: TreatmentSummary[];
}

export interface PatientStatistics {
  totalAppointments: number;
  upcomingAppointments: number;
  completedTreatments: number;
  activeTreatments: number;
  totalSpent: number;
  pendingBalance: number;
  lastVisit: Date | null;
  nextAppointment: Date | null;
}

export interface PatientHistory {
  patient: Patient;
  appointments: AppointmentDetail[];
  treatments: TreatmentDetail[];
  invoices: InvoiceDetail[];
}

export interface PatientFinancialSummary {
  patientId: string;
  patientName: string;
  totalBilled: number;
  totalPaid: number;
  pendingBalance: number;
  lastPaymentDate: Date | null;
  recentPayments: PaymentDetail[];
  pendingInvoices: InvoiceDetail[];
}

// Interfaces auxiliares para resúmenes
export interface AppointmentSummary {
  id: string;
  date: Date;
  doctorName: string;
  reason: string;
  status: string;
}

export interface TreatmentSummary {
  id: string;
  serviceName: string;
  startDate: Date;
  status: string;
  toothNumber: string | null;
}

// Interfaces auxiliares para detalles
export interface AppointmentDetail {
  id: string;
  date: Date;
  doctorId: string;
  doctorName: string;
  patientId: string;
  reason: string;
  status: string;
  duration: number;
  notes: string | null;
  createdAt: Date;
}

export interface TreatmentDetail {
  id: string;
  patientId: string;
  serviceId: string;
  serviceName: string;
  startDate: Date;
  endDate: Date | null;
  status: string;
  toothNumber: string | null;
  surface: string | null;
  notes: string | null;
  createdAt: Date;
}

export interface InvoiceDetail {
  id: string;
  invoiceNumber: string;
  patientId: string;
  date: Date;
  dueDate: Date;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  createdAt: Date;
}

export interface PaymentDetail {
  id: string;
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: Date;
  reference: string | null;
}

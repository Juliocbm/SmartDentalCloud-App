/**
 * Modelos para el dashboard de analytics de dentistas
 */

export interface DentistDashboardMetrics {
  totalDentists: number;
  activeDentists: number;
  appointmentsCompleted: number;
  appointmentsCancelled: number;
  treatmentsCompleted: number;
  totalRevenue: number;
  completionRate: number;
  avgRevenuePerDentist: number;
}

export interface DentistIndividualMetrics {
  dentistId: string;
  dentistName: string;
  specialty: string;
  appointmentsCompleted: number;
  appointmentsCancelled: number;
  noShowCount: number;
  occupancyRate: number;
  completionRate: number;
  revenue: number;
  treatmentsCompleted: number;
}

export interface DentistRanking {
  dentistId: string;
  dentistName: string;
  value: number;
  secondaryValue?: number;
  subtitle: string;
}

export interface DentistTeamMember {
  id: string;
  name: string;
  specialty: string;
  isActive: boolean;
  appointmentsThisMonth: number;
  revenueThisMonth: number;
}

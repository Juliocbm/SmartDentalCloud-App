import { AppointmentStatus } from './appointment.models';

/** Cita próxima para mostrar en el dashboard */
export interface UpcomingAppointment {
  id: string;
  patientName: string;
  doctorName: string | null;
  startAt: Date;
  endAt: Date;
  reason: string;
  status: AppointmentStatus;
  displayTime: string;
  statusColor: string;
  statusLabel: string;
}

/** Cita pendiente de confirmar */
export interface PendingConfirmation {
  id: string;
  patientName: string;
  doctorName: string | null;
  startAt: Date;
  reason: string;
  displayTime: string;
  displayDate: string;
  hoursUntil: number;
}

/** Distribución de citas por estado */
export interface StatusDistribution {
  status: AppointmentStatus;
  label: string;
  count: number;
  color: string;
}

/** Citas por día de la semana */
export interface WeekdayDistribution {
  dayName: string;
  dayNumber: number;
  count: number;
}

/** Citas por doctor */
export interface DoctorWorkload {
  doctorId: string;
  doctorName: string;
  totalAppointments: number;
  completedAppointments: number;
  completionRate: number;
}

/** Actividad reciente de citas */
export interface AppointmentActivity {
  id: string;
  type: AppointmentActivityType;
  description: string;
  timestamp: Date;
  patientName?: string;
  appointmentId?: string;
}

export type AppointmentActivityType = 
  | 'created' 
  | 'confirmed' 
  | 'completed' 
  | 'cancelled' 
  | 'rescheduled' 
  | 'no_show';

/** Configuración visual de tipos de actividad */
export const APPOINTMENT_ACTIVITY_CONFIG: Record<AppointmentActivityType, { icon: string; color: string }> = {
  created: { icon: 'fa-calendar-plus', color: 'primary' },
  confirmed: { icon: 'fa-check-circle', color: 'success' },
  completed: { icon: 'fa-check-double', color: 'success' },
  cancelled: { icon: 'fa-calendar-xmark', color: 'error' },
  rescheduled: { icon: 'fa-calendar-days', color: 'info' },
  no_show: { icon: 'fa-user-xmark', color: 'warning' }
};

/** Paciente frecuente */
export interface FrequentPatient {
  patientId: string;
  patientName: string;
  totalAppointments: number;
  completedAppointments: number;
  lastVisit: Date | null;
  nextAppointment: Date | null;
}

/** Métricas del dashboard de citas */
export interface AppointmentDashboardMetrics {
  todayTotal: number;
  todayCompleted: number;
  todayPending: number;
  weekTotal: number;
  weekCompleted: number;
  pendingConfirmations: number;
  noShowsThisMonth: number;
  completionRateMonth: number;
}

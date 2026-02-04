import { Patient } from './patient.models';

/**
 * Estadísticas generales del módulo de pacientes
 */
export interface PatientsStatistics {
  totalPatients: number;
  activePatients: number;
  inactivePatients: number;
  newThisMonth: number;
  newThisWeek: number;
  averageAge: number;
  genderDistribution: GenderDistribution;
}

/**
 * Distribución por género
 */
export interface GenderDistribution {
  male: number;
  female: number;
  other: number;
}

/**
 * Alertas de pacientes
 */
export interface PatientAlert {
  id: string;
  type: PatientAlertType;
  patientId: string;
  patientName: string;
  message: string;
  severity: AlertSeverity;
  date: Date;
}

export type PatientAlertType = 
  | 'no_recent_appointment'
  | 'pending_treatment'
  | 'pending_balance'
  | 'birthday_today'
  | 'inactive_patient';

export type AlertSeverity = 'low' | 'medium' | 'high';

/**
 * Paciente con información resumida para listas
 */
export interface PatientListItem {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  lastVisit: Date | null;
  nextAppointment: Date | null;
  pendingBalance: number;
  isActive: boolean;
}

/**
 * Paciente con cumpleaños
 */
export interface PatientBirthday {
  id: string;
  fullName: string;
  dateOfBirth: Date;
  age: number;
  daysUntilBirthday: number;
  phone: string | null;
}

/**
 * Paciente con saldo pendiente
 */
export interface PatientWithBalance {
  id: string;
  fullName: string;
  pendingBalance: number;
  lastPaymentDate: Date | null;
  daysSinceLastPayment: number | null;
}

/**
 * Datos para gráfico de pacientes por edad
 */
export interface AgeGroupData {
  ageGroup: string;
  count: number;
  percentage: number;
}

/**
 * Datos para gráfico de nuevos vs recurrentes
 */
export interface PatientTypeData {
  period: string;
  newPatients: number;
  recurringPatients: number;
}

/**
 * Analytics completo del dashboard de pacientes
 */
export interface PatientsAnalytics {
  statistics: PatientsStatistics;
  alerts: PatientAlert[];
  recentPatients: PatientListItem[];
  birthdaysThisMonth: PatientBirthday[];
  patientsWithBalance: PatientWithBalance[];
  ageDistribution: AgeGroupData[];
  patientTrend: PatientTypeData[];
}

/**
 * Configuración de alertas de pacientes
 */
export const PATIENT_ALERT_CONFIG: Record<PatientAlertType, { icon: string; color: string; label: string }> = {
  'no_recent_appointment': {
    icon: 'fa-solid fa-calendar-xmark',
    color: 'warning',
    label: 'Sin cita reciente'
  },
  'pending_treatment': {
    icon: 'fa-solid fa-tooth',
    color: 'info',
    label: 'Tratamiento pendiente'
  },
  'pending_balance': {
    icon: 'fa-solid fa-dollar-sign',
    color: 'danger',
    label: 'Saldo pendiente'
  },
  'birthday_today': {
    icon: 'fa-solid fa-cake-candles',
    color: 'success',
    label: 'Cumpleaños hoy'
  },
  'inactive_patient': {
    icon: 'fa-solid fa-user-slash',
    color: 'secondary',
    label: 'Paciente inactivo'
  }
};

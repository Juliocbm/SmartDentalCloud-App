/**
 * Schedule Exception Models — mirrors backend DTOs
 * API: /api/schedule-exceptions
 */

export interface ScheduleException {
  id: string;
  userId: string | null;
  userName: string | null;
  locationId: string | null;
  locationName: string | null;
  date: string;
  type: ScheduleExceptionType;
  reason: string;
  startTime: string | null;
  endTime: string | null;
  isRecurringYearly: boolean;
  createdAt: string;
}

export type ScheduleExceptionType = 'closedHoliday' | 'closedVacation' | 'closedOther' | 'modifiedHours';

export interface CreateScheduleExceptionRequest {
  userId?: string | null;
  locationId?: string | null;
  date: string;
  type: ScheduleExceptionType;
  reason: string;
  startTime?: string | null;
  endTime?: string | null;
  isRecurringYearly: boolean;
}

export interface UpdateScheduleExceptionRequest {
  userId?: string | null;
  locationId?: string | null;
  date: string;
  type: ScheduleExceptionType;
  reason: string;
  startTime?: string | null;
  endTime?: string | null;
  isRecurringYearly: boolean;
}

export const EXCEPTION_TYPE_LABELS: Record<ScheduleExceptionType, string> = {
  closedHoliday: 'Día Festivo',
  closedVacation: 'Vacaciones',
  closedOther: 'Cierre',
  modifiedHours: 'Horario Modificado'
};

export const EXCEPTION_TYPE_ICONS: Record<ScheduleExceptionType, string> = {
  closedHoliday: 'fa-solid fa-calendar-xmark',
  closedVacation: 'fa-solid fa-umbrella-beach',
  closedOther: 'fa-solid fa-ban',
  modifiedHours: 'fa-solid fa-clock'
};

export const EXCEPTION_TYPE_COLORS: Record<ScheduleExceptionType, string> = {
  closedHoliday: 'badge-error',
  closedVacation: 'badge-info',
  closedOther: 'badge-warning',
  modifiedHours: 'badge-neutral'
};

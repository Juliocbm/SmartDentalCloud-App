export enum AppointmentStatus {
  Scheduled = 'Scheduled',
  Confirmed = 'Confirmed',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
  NoShow = 'NoShow'
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  userId: string | null;
  doctorName: string | null;
  locationId: string | null;
  locationName: string | null;
  startAt: Date;
  endAt: Date;
  reason: string;
  status: AppointmentStatus;
  notes?: string;
  cancellationReason?: string;
  createdAt: Date;
}

export interface CreateAppointmentRequest {
  patientId: string;
  userId: string;
  locationId?: string | null;
  startAt: Date;
  endAt: Date;
  reason: string;
}

export interface RescheduleAppointmentRequest {
  newStartAt: Date;
  newEndAt: Date;
  locationId?: string | null;
}

export interface UpdateAppointmentNotesRequest {
  notes: string;
}

export interface CancelAppointmentRequest {
  cancellationReason?: string;
}

export interface AppointmentFilters {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  patientId?: string;
  status?: AppointmentStatus;
  searchTerm?: string;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

export interface AppointmentStatistics {
  total: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  noShow: number;
  completionRate: number;
  noShowRate: number;
}

export interface AppointmentListItem extends Appointment {
  displayTime: string;
  displayDate: string;
  statusColor: string;
  statusLabel: string;
  durationMinutes: number;
}

export const AppointmentStatusConfig = {
  [AppointmentStatus.Scheduled]: {
    color: 'primary',
    bgColor: 'badge-info',
    label: 'Programada',
    icon: 'fa-calendar'
  },
  [AppointmentStatus.Confirmed]: {
    color: 'success',
    bgColor: 'badge-success',
    label: 'Confirmada',
    icon: 'fa-check-circle'
  },
  [AppointmentStatus.Completed]: {
    color: 'success',
    bgColor: 'badge-secondary',
    label: 'Completada',
    icon: 'fa-check'
  },
  [AppointmentStatus.Cancelled]: {
    color: 'error',
    bgColor: 'badge-error',
    label: 'Cancelada',
    icon: 'fa-times-circle'
  },
  [AppointmentStatus.NoShow]: {
    color: 'warning',
    bgColor: 'badge-warning',
    label: 'No asistió',
    icon: 'fa-exclamation-triangle'
  }
};

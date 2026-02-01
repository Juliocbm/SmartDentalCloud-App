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
  startAt: Date;
  endAt: Date;
  reason: string;
}

export interface RescheduleAppointmentRequest {
  newStartAt: Date;
  newEndAt: Date;
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
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    label: 'Programada',
    icon: 'fa-calendar'
  },
  [AppointmentStatus.Confirmed]: {
    color: 'success',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    label: 'Confirmada',
    icon: 'fa-check-circle'
  },
  [AppointmentStatus.Completed]: {
    color: 'success',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    label: 'Completada',
    icon: 'fa-check'
  },
  [AppointmentStatus.Cancelled]: {
    color: 'error',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    label: 'Cancelada',
    icon: 'fa-times-circle'
  },
  [AppointmentStatus.NoShow]: {
    color: 'warning',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    label: 'No asistió',
    icon: 'fa-exclamation-triangle'
  }
};

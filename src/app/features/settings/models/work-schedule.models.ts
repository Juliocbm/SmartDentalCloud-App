/**
 * Work Schedule Models — mirrors backend DTOs
 * API: /api/tenants/work-schedule
 */

export interface DaySchedule {
  dayOfWeek: string;
  isOpen: boolean;
  startTime: string | null;
  endTime: string | null;
  lunchStartTime?: string | null;
  lunchEndTime?: string | null;
  slotDurationMinutes?: number | null;
}

export interface WorkSchedule {
  userId: string | null;
  locationId?: string | null;
  locationName?: string | null;
  days: DaySchedule[];
}

export const SLOT_DURATION_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 20, label: '20 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' }
];

export const DAY_LABELS: Record<string, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo'
};

export const DAY_ORDER: string[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];

/**
 * Mapeo de nombre de día a número de FullCalendar (0=domingo, 1=lunes, ...)
 */
export const DAY_TO_FULLCALENDAR: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6
};

export const DEFAULT_WORK_SCHEDULE: WorkSchedule = {
  userId: null,
  days: [
    { dayOfWeek: 'monday',    isOpen: true,  startTime: '08:00', endTime: '18:00', lunchStartTime: '13:00', lunchEndTime: '14:00', slotDurationMinutes: 30 },
    { dayOfWeek: 'tuesday',   isOpen: true,  startTime: '08:00', endTime: '18:00', lunchStartTime: '13:00', lunchEndTime: '14:00', slotDurationMinutes: 30 },
    { dayOfWeek: 'wednesday', isOpen: true,  startTime: '08:00', endTime: '18:00', lunchStartTime: '13:00', lunchEndTime: '14:00', slotDurationMinutes: 30 },
    { dayOfWeek: 'thursday',  isOpen: true,  startTime: '08:00', endTime: '18:00', lunchStartTime: '13:00', lunchEndTime: '14:00', slotDurationMinutes: 30 },
    { dayOfWeek: 'friday',    isOpen: true,  startTime: '08:00', endTime: '18:00', lunchStartTime: '13:00', lunchEndTime: '14:00', slotDurationMinutes: 30 },
    { dayOfWeek: 'saturday',  isOpen: false, startTime: null,     endTime: null,     lunchStartTime: null,    lunchEndTime: null,    slotDurationMinutes: null },
    { dayOfWeek: 'sunday',    isOpen: false, startTime: null,     endTime: null,     lunchStartTime: null,    lunchEndTime: null,    slotDurationMinutes: null }
  ]
};

/**
 * Genera opciones de hora cada 30 minutos (06:00 a 23:00)
 */
export function generateTimeOptions(): string[] {
  const options: string[] = [];
  for (let h = 6; h <= 23; h++) {
    options.push(`${h.toString().padStart(2, '0')}:00`);
    if (h < 23) {
      options.push(`${h.toString().padStart(2, '0')}:30`);
    }
  }
  return options;
}

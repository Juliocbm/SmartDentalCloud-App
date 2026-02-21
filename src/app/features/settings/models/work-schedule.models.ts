/**
 * Work Schedule Models — mirrors backend DTOs
 * API: /api/tenants/work-schedule
 */

export interface DaySchedule {
  dayOfWeek: string;
  isOpen: boolean;
  startTime: string | null;
  endTime: string | null;
}

export interface WorkSchedule {
  userId: string | null;
  days: DaySchedule[];
}

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
    { dayOfWeek: 'monday',    isOpen: true,  startTime: '08:00', endTime: '18:00' },
    { dayOfWeek: 'tuesday',   isOpen: true,  startTime: '08:00', endTime: '18:00' },
    { dayOfWeek: 'wednesday', isOpen: true,  startTime: '08:00', endTime: '18:00' },
    { dayOfWeek: 'thursday',  isOpen: true,  startTime: '08:00', endTime: '18:00' },
    { dayOfWeek: 'friday',    isOpen: true,  startTime: '08:00', endTime: '18:00' },
    { dayOfWeek: 'saturday',  isOpen: false, startTime: null,     endTime: null    },
    { dayOfWeek: 'sunday',    isOpen: false, startTime: null,     endTime: null    }
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

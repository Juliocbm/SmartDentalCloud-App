import { Component, OnInit, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FullCalendarModule, FullCalendarComponent } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg, DateSelectArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { ModalComponent } from '../../../../shared/components/modal/modal';
import { AppointmentsService } from '../../services/appointments.service';
import { Appointment, AppointmentStatusConfig } from '../../models/appointment.models';
import { AppointmentFormContextService } from '../../services/appointment-form-context.service';
import { CALENDAR_APPOINTMENT_CONTEXT } from '../../models/appointment-form-context.model';
import { LoggingService } from '../../../../core/services/logging.service';
import { DentistListItem } from '../../../../core/models/user.models';
import { SettingsService } from '../../../settings/services/settings.service';
import { DaySchedule, DAY_TO_FULLCALENDAR } from '../../../settings/models/work-schedule.models';
import { ScheduleException, EXCEPTION_TYPE_LABELS } from '../../../settings/models/schedule-exception.models';
import { LocationsService } from '../../../settings/services/locations.service';
import { LocationSummary } from '../../../settings/models/location.models';
import { LocationAutocompleteComponent } from '../../../../shared/components/location-autocomplete/location-autocomplete';
import { DentistAutocompleteComponent } from '../../../../shared/components/dentist-autocomplete/dentist-autocomplete';

@Component({
  selector: 'app-appointment-calendar',
  standalone: true,
  imports: [CommonModule, FullCalendarModule, RouterLink, PageHeaderComponent, ModalComponent, LocationAutocompleteComponent, DentistAutocompleteComponent],
  templateUrl: './appointment-calendar.html',
  styleUrl: './appointment-calendar.scss'
})
export class AppointmentCalendarComponent implements OnInit {
  private appointmentsService = inject(AppointmentsService);
  private settingsService = inject(SettingsService);
  private router = inject(Router);
  private logger = inject(LoggingService);
  private contextService = inject(AppointmentFormContextService);
  locationsService = inject(LocationsService);

  private calendarRef = viewChild(FullCalendarComponent);

  appointments = signal<Appointment[]>([]);
  loading = signal(true);
  selectedView = signal<'week' | 'day'>('week');
  showQuickCreateModal = signal(false);
  selectedSlot = signal<{ start: Date; end: Date } | null>(null);
  selectedDoctorId = signal<string | null>(null);
  private selectedDentistObj = signal<DentistListItem | null>(null);
  selectedLocationId = signal<string | null>(null);
  private selectedLocationObj = signal<LocationSummary | null>(null);
  scheduleExceptions = signal<ScheduleException[]>([]);
  visibleRange = signal<{ start: string; end: string } | null>(null);

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Citas', route: '/appointments' },
    { label: 'Calendario' }
  ];

  calendarOptions = signal<CalendarOptions>({
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    locale: esLocale,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'timeGridWeek,timeGridDay'
    },
    slotMinTime: '08:00:00',
    slotMaxTime: '19:00:00',
    slotDuration: '00:30:00',
    slotLabelInterval: '01:00',
    allDaySlot: false,
    allDayText: '',
    height: 'auto',
    expandRows: true,
    nowIndicator: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    weekends: true,
    validRange: {
      start: new Date()
    },
    selectAllow: (selectInfo) => {
      // Never allow creating appointments from the all-day row
      if (selectInfo.allDay) return false;
      const now = new Date();
      if (selectInfo.start < now) return false;
      return !this.isDateBlockedByException(selectInfo.start);
    },
    businessHours: {
      daysOfWeek: [1, 2, 3, 4, 5],
      startTime: '08:00',
      endTime: '18:00'
    },
    eventClick: this.handleEventClick.bind(this),
    select: this.handleDateSelect.bind(this),
    datesSet: (dateInfo) => {
      const start = dateInfo.start.toISOString().split('T')[0];
      const end = dateInfo.end.toISOString().split('T')[0];
      this.visibleRange.set({ start, end });
      this.applyScheduleExceptions();
    },
    events: [],
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      meridiem: false,
      hour12: false
    },
    slotLabelFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }
  });

  ngOnInit(): void {
    this.loadWorkSchedule();
    this.loadScheduleExceptions();
    this.loadAppointments();
  }

  private loadWorkSchedule(): void {
    this.settingsService.getWorkSchedule().subscribe({
      next: (schedule) => this.applyWorkSchedule(schedule.days),
      error: () => this.logger.warn('Could not load work schedule, using defaults')
    });
  }

  private loadScheduleExceptions(): void {
    const from = new Date();
    from.setDate(from.getDate() - 30);
    const to = new Date();
    to.setDate(to.getDate() + 90);

    const fromStr = from.toISOString().split('T')[0];
    const toStr = to.toISOString().split('T')[0];

    this.settingsService.getScheduleExceptions(fromStr, toStr).subscribe({
      next: (exceptions) => {
        this.scheduleExceptions.set(exceptions);
        this.applyScheduleExceptions();
      },
      error: () => this.logger.warn('Could not load schedule exceptions')
    });
  }

  private applyScheduleExceptions(): void {
    const allExceptions = this.scheduleExceptions();
    const selectedDentist = this.selectedDoctorId();
    const exceptionEvents: any[] = [];

    for (const ex of allExceptions) {
      const isClosed = ex.type !== 'modifiedHours';
      const isClinicWide = !ex.userId;
      const isDentistSpecific = !!ex.userId;

      // Determine visibility based on dentist filter
      let showAsFull = false;
      let showAsSubtle = false;

      if (!selectedDentist) {
        // Viewing all: clinic-wide = full, dentist-specific = subtle indicator
        showAsFull = isClinicWide;
        showAsSubtle = isDentistSpecific && isClosed;
      } else {
        // Viewing specific dentist: clinic-wide = full, this dentist's = full, others = hidden
        if (isClinicWide) {
          showAsFull = true;
        } else if (ex.userId === selectedDentist) {
          showAsFull = true;
        }
        // else: hide (not relevant to this dentist)
      }

      if (showAsFull) {
        // Background shading for the entire day column
        exceptionEvents.push({
          id: 'exception-bg-' + ex.id,
          start: ex.date,
          end: ex.date,
          allDay: true,
          display: 'background',
          backgroundColor: isClosed ? '#fee2e2' : '#fef3c7',
          classNames: [isClosed ? 'exception-closed-bg' : 'exception-modified-bg']
        });

        // Visible all-day banner
        const scope = isClinicWide ? '' : ` (${ex.userName})`;
        exceptionEvents.push({
          id: 'exception-' + ex.id,
          title: isClosed ? `🚫 ${ex.reason}${scope}` : `⏰ ${ex.reason}${scope}`,
          start: ex.date,
          end: ex.date,
          allDay: true,
          display: 'block',
          backgroundColor: isClosed ? '#dc2626' : '#d97706',
          borderColor: isClosed ? '#dc2626' : '#d97706',
          textColor: '#ffffff',
          classNames: [isClosed ? 'exception-closed-banner' : 'exception-modified-banner'],
          editable: false
        });
      } else if (showAsSubtle) {
        // Subtle indicator: small muted banner visible in "Todos" view
        exceptionEvents.push({
          id: 'exception-' + ex.id,
          title: `${ex.userName}: ${ex.reason}`,
          start: ex.date,
          end: ex.date,
          allDay: true,
          display: 'block',
          backgroundColor: '#94a3b8',
          borderColor: '#94a3b8',
          textColor: '#ffffff',
          classNames: ['exception-subtle-banner'],
          editable: false
        });
      }
    }

    // Toggle allDaySlot: show only when there are visible banner events IN the current view range
    const range = this.visibleRange();
    const hasVisibleBanners = exceptionEvents.some(e => {
      if (e.display !== 'block') return false;
      if (!range) return true; // No range yet, show if any exist
      return e.start >= range.start && e.start < range.end;
    });

    this.calendarOptions.update(options => ({
      ...options,
      allDaySlot: hasVisibleBanners,
      events: [...(Array.isArray(options.events) ? options.events.filter(
        (e: any) => !e.id?.startsWith('exception-')
      ) : []), ...exceptionEvents]
    }));
  }

  /**
   * Checks if a date is fully blocked by an exception for the current dentist context.
   * Used by selectAllow and handleDateSelect.
   */
  private isDateBlockedByException(date: Date): boolean {
    const dateStr = date.toISOString().split('T')[0];
    const selectedDentist = this.selectedDoctorId();

    return this.scheduleExceptions().some(ex => {
      if (ex.date !== dateStr) return false;
      if (ex.type === 'modifiedHours') return false; // Modified hours don't block

      // Clinic-wide closure blocks everyone
      if (!ex.userId) return true;

      // Dentist-specific closure blocks only when viewing that dentist
      if (selectedDentist && ex.userId === selectedDentist) return true;

      return false;
    });
  }

  private applyWorkSchedule(days: DaySchedule[]): void {
    const openDays = days.filter(d => d.isOpen);
    if (openDays.length === 0) return;

    const businessHours = openDays.map(d => ({
      daysOfWeek: [DAY_TO_FULLCALENDAR[d.dayOfWeek]],
      startTime: d.startTime!,
      endTime: d.endTime!
    }));

    const allStarts = openDays.map(d => d.startTime!).sort();
    const allEnds = openDays.map(d => d.endTime!).sort();
    const slotMinTime = allStarts[0] + ':00';
    const slotMaxTime = allEnds[allEnds.length - 1] + ':00';

    const weekends = openDays.some(d =>
      d.dayOfWeek === 'saturday' || d.dayOfWeek === 'sunday'
    );

    this.calendarOptions.update(options => ({
      ...options,
      businessHours,
      slotMinTime,
      slotMaxTime,
      weekends
    }));
  }

  loadAppointments(): void {
    this.loading.set(true);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 60);

    this.appointmentsService.getByRange(startDate, endDate).subscribe({
      next: (appointments) => {
        this.appointments.set(appointments);
        this.updateCalendarEvents(appointments);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading appointments:', err);
        this.loading.set(false);
      }
    });
  }

  private updateCalendarEvents(appointments: Appointment[]): void {
    const events = appointments.map(apt => {
      const config = AppointmentStatusConfig[apt.status];
      
      return {
        id: apt.id,
        title: `${apt.patientName} - ${apt.reason}`,
        start: apt.startAt,
        end: apt.endAt,
        backgroundColor: this.getEventColor(apt.status),
        borderColor: this.getEventColor(apt.status),
        extendedProps: {
          appointment: apt,
          patientName: apt.patientName,
          doctorName: apt.doctorName,
          reason: apt.reason,
          status: apt.status
        }
      };
    });

    this.calendarOptions.update(options => ({
      ...options,
      events: [
        ...events,
        ...(Array.isArray(options.events) ? options.events.filter(
          (e: any) => e.id?.startsWith('exception-')
        ) : [])
      ]
    }));
  }

  private getEventColor(status: string): string {
    const colors: Record<string, string> = {
      'Scheduled': '#3b82f6',
      'Confirmed': '#10b981',
      'Completed': '#6b7280',
      'Cancelled': '#ef4444',
      'NoShow': '#f59e0b'
    };
    return colors[status] || '#6b7280';
  }

  handleEventClick(clickInfo: EventClickArg): void {
    const eventId = clickInfo.event.id;
    // Ignore clicks on exception events
    if (eventId.startsWith('exception-')) return;
    this.router.navigate(['/appointments', eventId, 'edit']);
  }

  handleDateSelect(selectInfo: DateSelectArg): void {
    // Never open modal from all-day row or blocked days
    if (selectInfo.allDay) return;
    if (this.isDateBlockedByException(selectInfo.start)) return;

    this.selectedSlot.set({
      start: selectInfo.start,
      end: selectInfo.end
    });
    this.showQuickCreateModal.set(true);
  }

  closeModal(): void {
    this.showQuickCreateModal.set(false);
    this.selectedSlot.set(null);
  }

  navigateToFullForm(): void {
    const slot = this.selectedSlot();
    if (slot) {
      const dentist = this.selectedDentistObj();

      this.contextService.setContext(
        CALENDAR_APPOINTMENT_CONTEXT(
          slot.start,
          slot.end,
          dentist?.id,
          dentist?.name,
          dentist?.specialization ?? undefined
        )
      );

      this.router.navigate(['/appointments/new']);
    }
  }

  switchToWeek(): void {
    this.selectedView.set('week');
    this.calendarOptions.update(options => ({
      ...options,
      initialView: 'timeGridWeek'
    }));
  }

  switchToDay(): void {
    this.selectedView.set('day');
    this.calendarOptions.update(options => ({
      ...options,
      initialView: 'timeGridDay'
    }));
  }

  goToToday(): void {
    const calendarApi = this.calendarRef()?.getApi();
    if (calendarApi) {
      calendarApi.today();
    }
  }

  goToListView(): void {
    this.router.navigate(['/appointments']);
  }

  onLocationSelected(location: LocationSummary | null): void {
    this.selectedLocationObj.set(location);
    this.selectedLocationId.set(location?.id ?? null);
    this.applyFilters();
  }

  private applyFilters(): void {
    const allAppointments = this.appointments();
    const dentistId = this.selectedDoctorId();
    const locationId = this.selectedLocationId();

    let filtered = allAppointments;
    if (dentistId) {
      filtered = filtered.filter(apt => apt.userId === dentistId);
    }
    if (locationId) {
      filtered = filtered.filter(apt => apt.locationId === locationId);
    }
    this.updateCalendarEvents(filtered);
  }

  onDentistSelected(dentist: DentistListItem | null): void {
    this.selectedDentistObj.set(dentist);
    this.selectedDoctorId.set(dentist?.id ?? null);
    
    if (!dentist) {
      this.loadWorkSchedule();
    } else {
      this.settingsService.getDentistWorkSchedule(dentist.id).subscribe({
        next: (schedule) => this.applyWorkSchedule(schedule.days),
        error: () => this.loadWorkSchedule()
      });
    }

    this.applyFilters();
    this.applyScheduleExceptions();
  }
}

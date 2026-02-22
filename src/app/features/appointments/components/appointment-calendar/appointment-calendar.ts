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
import { UsersService } from '../../../../core/services/users.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { DentistListItem } from '../../../../core/models/user.models';
import { SettingsService } from '../../../settings/services/settings.service';
import { DaySchedule, DAY_TO_FULLCALENDAR } from '../../../settings/models/work-schedule.models';

@Component({
  selector: 'app-appointment-calendar',
  standalone: true,
  imports: [CommonModule, FullCalendarModule, RouterLink, PageHeaderComponent, ModalComponent],
  templateUrl: './appointment-calendar.html',
  styleUrl: './appointment-calendar.scss'
})
export class AppointmentCalendarComponent implements OnInit {
  private appointmentsService = inject(AppointmentsService);
  private usersService = inject(UsersService);
  private settingsService = inject(SettingsService);
  private router = inject(Router);
  private logger = inject(LoggingService);
  private contextService = inject(AppointmentFormContextService);

  private calendarRef = viewChild(FullCalendarComponent);

  appointments = signal<Appointment[]>([]);
  loading = signal(true);
  selectedView = signal<'week' | 'day'>('week');
  showQuickCreateModal = signal(false);
  selectedSlot = signal<{ start: Date; end: Date } | null>(null);
  dentists = signal<DentistListItem[]>([]);
  selectedDoctorId = signal<string>('all');

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
      const now = new Date();
      return selectInfo.start >= now;
    },
    businessHours: {
      daysOfWeek: [1, 2, 3, 4, 5],
      startTime: '08:00',
      endTime: '18:00'
    },
    eventClick: this.handleEventClick.bind(this),
    select: this.handleDateSelect.bind(this),
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
    this.loadDentists();
    this.loadAppointments();
  }

  private loadWorkSchedule(): void {
    this.settingsService.getWorkSchedule().subscribe({
      next: (schedule) => this.applyWorkSchedule(schedule.days),
      error: () => this.logger.warn('Could not load work schedule, using defaults')
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
      error: (error) => {
        this.logger.error('Error loading appointments:', error);
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
      events
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
    const appointmentId = clickInfo.event.id;
    this.router.navigate(['/appointments', appointmentId, 'edit']);
  }

  handleDateSelect(selectInfo: DateSelectArg): void {
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
      const selectedId = this.selectedDoctorId();
      const dentist = selectedId !== 'all'
        ? this.dentists().find(d => d.id === selectedId)
        : undefined;

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

  private loadDentists(): void {
    this.usersService.getDentists().subscribe({
      next: (dentists) => {
        this.dentists.set(dentists);
      },
      error: (error) => {
        this.logger.error('Error loading dentists:', error);
        this.dentists.set([]);
      }
    });
  }

  onDentistChange(dentistId: string): void {
    this.selectedDoctorId.set(dentistId);
    const allAppointments = this.appointments();
    
    if (dentistId === 'all') {
      this.updateCalendarEvents(allAppointments);
      // Reload clinic-wide schedule
      this.loadWorkSchedule();
    } else {
      const filtered = allAppointments.filter(apt => apt.userId === dentistId);
      this.updateCalendarEvents(filtered);
      // Load dentist-specific schedule (falls back to clinic defaults from backend)
      this.settingsService.getDentistWorkSchedule(dentistId).subscribe({
        next: (schedule) => this.applyWorkSchedule(schedule.days),
        error: () => this.loadWorkSchedule() // Fallback to clinic schedule
      });
    }
  }
}

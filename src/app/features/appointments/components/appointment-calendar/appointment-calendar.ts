import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg, DateSelectArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { AppointmentsService } from '../../services/appointments.service';
import { Appointment, AppointmentStatusConfig } from '../../models/appointment.models';

@Component({
  selector: 'app-appointment-calendar',
  standalone: true,
  imports: [CommonModule, FullCalendarModule, RouterLink],
  templateUrl: './appointment-calendar.html',
  styleUrl: './appointment-calendar.scss'
})
export class AppointmentCalendarComponent implements OnInit {
  private appointmentsService = inject(AppointmentsService);
  private router = inject(Router);

  appointments = signal<Appointment[]>([]);
  loading = signal(true);
  selectedView = signal<'week' | 'day'>('week');
  showQuickCreateModal = signal(false);
  selectedSlot = signal<{ start: Date; end: Date } | null>(null);

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
    this.loadAppointments();
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
        console.error('Error loading appointments:', error);
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
      this.router.navigate(['/appointments/new'], {
        queryParams: {
          startAt: slot.start.toISOString(),
          endAt: slot.end.toISOString()
        }
      });
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
    const calendarApi = (document.querySelector('full-calendar') as any)?.getApi();
    if (calendarApi) {
      calendarApi.today();
    }
  }

  goToListView(): void {
    this.router.navigate(['/appointments']);
  }
}

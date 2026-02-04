import { Routes } from '@angular/router';
import { AppointmentsService } from './services/appointments.service';
import { AppointmentsAnalyticsService } from './services/appointments-analytics.service';

export const APPOINTMENTS_ROUTES: Routes = [
  {
    path: '',
    providers: [AppointmentsService, AppointmentsAnalyticsService],
    children: [
      {
        path: '',
        loadComponent: () => import('./components/appointment-list/appointment-list')
          .then(m => m.AppointmentListComponent)
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./components/appointments-dashboard/appointments-dashboard')
          .then(m => m.AppointmentsDashboardComponent)
      },
      {
        path: 'calendar',
        loadComponent: () => import('./components/appointment-calendar/appointment-calendar')
          .then(m => m.AppointmentCalendarComponent)
      },
      {
        path: 'new',
        loadComponent: () => import('./components/appointment-form/appointment-form')
          .then(m => m.AppointmentFormComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./components/appointment-detail/appointment-detail')
          .then(m => m.AppointmentDetailComponent)
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./components/appointment-form/appointment-form')
          .then(m => m.AppointmentFormComponent)
      }
    ]
  }
];

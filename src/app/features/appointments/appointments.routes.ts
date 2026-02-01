import { Routes } from '@angular/router';
import { AppointmentsService } from './services/appointments.service';

export const APPOINTMENTS_ROUTES: Routes = [
  {
    path: '',
    providers: [AppointmentsService],
    children: [
      {
        path: '',
        loadComponent: () => import('./components/appointment-list/appointment-list')
          .then(m => m.AppointmentListComponent)
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
        path: ':id/edit',
        loadComponent: () => import('./components/appointment-form/appointment-form')
          .then(m => m.AppointmentFormComponent)
      }
    ]
  }
];

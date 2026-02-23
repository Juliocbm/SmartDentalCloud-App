import { Routes } from '@angular/router';
import { UsersService } from './services/users.service';
import { RolesService } from './services/roles.service';
import { UserFormContextService } from './services/user-form-context.service';
import { AppointmentFormContextService } from '../appointments/services/appointment-form-context.service';
import { ReportsService } from '../reports/services/reports.service';

export const DENTISTS_ROUTES: Routes = [
  {
    path: '',
    providers: [UsersService, RolesService, UserFormContextService, AppointmentFormContextService, ReportsService],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/dentist-list/dentist-list').then(m => m.DentistListComponent),
        title: 'Dentistas'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./components/dentist-dashboard/dentist-dashboard').then(m => m.DentistDashboardComponent),
        title: 'Dashboard de Dentistas'
      }
    ]
  }
];

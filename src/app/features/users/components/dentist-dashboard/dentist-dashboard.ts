import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { UsersService } from '../../services/users.service';
import { RolesService } from '../../services/roles.service';
import { ReportsService } from '../../../reports/services/reports.service';
import { User } from '../../models/user.models';
import { DentistProductivity } from '../../../reports/models/report.models';
import { LoggingService } from '../../../../core/services/logging.service';

@Component({
  selector: 'app-dentist-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, CurrencyPipe],
  templateUrl: './dentist-dashboard.html',
  styleUrl: './dentist-dashboard.scss'
})
export class DentistDashboardComponent implements OnInit {
  private usersService = inject(UsersService);
  private rolesService = inject(RolesService);
  private reportsService = inject(ReportsService);
  private logger = inject(LoggingService);

  loading = signal(true);
  error = signal<string | null>(null);
  dentists = signal<User[]>([]);
  productivity = signal<DentistProductivity[]>([]);

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Dentistas', route: '/dentists' },
    { label: 'Dashboard' }
  ];

  totalDentists = computed(() => this.dentists().length);
  activeDentists = computed(() => this.dentists().filter(d => d.isActive).length);
  inactiveDentists = computed(() => this.dentists().filter(d => !d.isActive).length);

  totalAppointmentsCompleted = computed(() =>
    this.productivity().reduce((sum, p) => sum + p.appointmentsCompleted, 0)
  );

  totalTreatmentsCompleted = computed(() =>
    this.productivity().reduce((sum, p) => sum + p.treatmentsCompleted, 0)
  );

  totalRevenue = computed(() =>
    this.productivity().reduce((sum, p) => sum + p.revenueGenerated, 0)
  );

  topPerformers = computed(() =>
    [...this.productivity()]
      .sort((a, b) => b.appointmentsCompleted - a.appointmentsCompleted)
      .slice(0, 8)
  );

  recentDentists = computed(() =>
    [...this.dentists()]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  );

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startDate = startOfMonth.toISOString().split('T')[0];
    const endDate = now.toISOString().split('T')[0];

    forkJoin([
      this.usersService.getAll(),
      this.rolesService.getAll(),
      this.reportsService.getDentistProductivity(startDate, endDate)
    ]).subscribe({
      next: ([users, roles, productivity]) => {
        const dentistUsers = users.filter(user =>
          user.roles.some(r => r.name === 'Dentista')
        );
        this.dentists.set(dentistUsers);
        this.productivity.set(productivity);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading dentist dashboard:', err);
        this.error.set('Error al cargar datos de dentistas');
        this.loading.set(false);
      }
    });
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-MX', {
      day: 'numeric', month: 'short', year: 'numeric'
    }).format(new Date(date));
  }
}

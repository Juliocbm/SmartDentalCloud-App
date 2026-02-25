import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, forkJoin } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { UsersService } from '../../services/users.service';
import { RolesService } from '../../services/roles.service';
import { User, Role } from '../../models/user.models';
import { UserFormContextService } from '../../services/user-form-context.service';
import { DENTIST_CONTEXT } from '../../models/user-form-context.model';
import { AppointmentFormContextService } from '../../../appointments/services/appointment-form-context.service';
import { DENTIST_APPOINTMENT_CONTEXT } from '../../../appointments/models/appointment-form-context.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';

@Component({
  selector: 'app-dentist-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PageHeaderComponent],
  templateUrl: './dentist-list.html',
  styleUrls: ['./dentist-list.scss']
})
export class DentistListComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private usersService = inject(UsersService);
  private rolesService = inject(RolesService);
  private userContextService = inject(UserFormContextService);
  private appointmentContextService = inject(AppointmentFormContextService);
  private notifications = inject(NotificationService);
  private logger = inject(LoggingService);
  private searchSubject = new Subject<string>();

  dentists = signal<User[]>([]);
  filteredDentists = signal<User[]>([]);
  dentistRole = signal<Role | null>(null);
  
  loading = signal(true);
  error = signal<string | null>(null);
  
  searchTerm = signal('');
  filterStatus = signal<'all' | 'active' | 'inactive'>('all');

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);

  paginatedDentists = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredDentists().slice(start, start + this.pageSize());
  });

  totalPages = computed(() =>
    Math.ceil(this.filteredDentists().length / this.pageSize()) || 1
  );

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Dentistas' }
  ];

  ngOnInit(): void {
    this.loadData();
    
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchTerm.set(term);
      this.applyFilters();
    });
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin([
      this.usersService.getAll(),
      this.rolesService.getAll()
    ]).subscribe({
      next: ([users, roles]) => {
        // Encontrar el rol de Dentista
        const dentistRole = roles.find(r => r.name === 'Dentista');
        this.dentistRole.set(dentistRole || null);
        
        // Filtrar solo usuarios con rol de Dentista
        const dentistUsers = users.filter(user => 
          user.roles.some(r => r.name === 'Dentista')
        );
        
        this.dentists.set(dentistUsers);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading dentists:', err);
        this.error.set(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.dentists()];

    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(dentist =>
        dentist.name.toLowerCase().includes(search) ||
        dentist.email.toLowerCase().includes(search) ||
        dentist.profile?.specialty?.toLowerCase().includes(search)
      );
    }

    const status = this.filterStatus();
    if (status !== 'all') {
      filtered = filtered.filter(dentist =>
        status === 'active' ? dentist.isActive : !dentist.isActive
      );
    }

    this.filteredDentists.set(filtered);
    this.currentPage.set(1);
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  onStatusFilterChange(value: 'all' | 'active' | 'inactive'): void {
    this.filterStatus.set(value);
    this.applyFilters();
  }

  async toggleDentistActive(dentist: User): Promise<void> {
    const action = dentist.isActive ? 'desactivar' : 'activar';
    const confirmed = await this.notifications.confirm(`¿Estás seguro de ${action} a ${dentist.name}?`);
    if (!confirmed) return;

    this.usersService.toggleActive(dentist.id).subscribe({
      next: (updatedUser) => {
        const index = this.dentists().findIndex(d => d.id === dentist.id);
        if (index !== -1) {
          const updated = [...this.dentists()];
          updated[index] = updatedUser;
          this.dentists.set(updated);
          this.applyFilters();
        }
        this.notifications.success(`Dentista ${action === 'activar' ? 'activado' : 'desactivado'} correctamente.`);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
      }
    });
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  getPaginationPages(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const maxVisible = 5;
    const pages: number[] = [];
    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    const end = Math.min(total, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  navigateToNewDentist(): void {
    this.userContextService.setContext(DENTIST_CONTEXT);
    this.router.navigate(['/users/new']);
  }

  editDentist(dentistId: string): void {
    this.userContextService.setContext(DENTIST_CONTEXT);
    this.router.navigate(['/users', dentistId, 'edit']);
  }

  createAppointmentForDentist(dentist: User): void {
    if (!dentist.isActive) {
      this.notifications.warning('No se pueden crear citas para dentistas inactivos.');
      return;
    }

    this.appointmentContextService.setContext(
      DENTIST_APPOINTMENT_CONTEXT(
        dentist.id, 
        dentist.name,
        dentist.profile?.specialty
      )
    );
    this.router.navigate(['/appointments/new']);
  }
}

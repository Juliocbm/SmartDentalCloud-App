import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { UsersService } from '../../services/users.service';
import { RolesService } from '../../services/roles.service';
import { User, Role } from '../../models/user.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoggingService } from '../../../../core/services/logging.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PageHeaderComponent],
  templateUrl: './user-list.html',
  styleUrls: ['./user-list.scss']
})
export class UserListComponent implements OnInit, OnDestroy {
  private usersService = inject(UsersService);
  private rolesService = inject(RolesService);
  private notifications = inject(NotificationService);
  private logger = inject(LoggingService);
  private searchSubject = new Subject<string>();

  users = signal<User[]>([]);
  filteredUsers = signal<User[]>([]);
  roles = signal<Role[]>([]);
  
  loading = signal(true);
  error = signal<string | null>(null);
  
  searchTerm = signal('');
  filterStatus = signal<'all' | 'active' | 'inactive'>('all');
  filterRole = signal<string>('all');

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Usuarios' }
  ];

  ngOnInit(): void {
    this.loadData();
    
    // Setup debounce for search with 300ms delay
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

    Promise.all([
      this.usersService.getAll().toPromise(),
      this.rolesService.getAll().toPromise()
    ])
      .then(([users, roles]) => {
        this.users.set(users || []);
        this.roles.set(roles || []);
        this.applyFilters();
        this.loading.set(false);
      })
      .catch(err => {
        this.logger.error('Error loading data:', err);
        this.error.set('Error al cargar usuarios. Intenta de nuevo.');
        this.loading.set(false);
      });
  }

  applyFilters(): void {
    let filtered = [...this.users()];

    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search)
      );
    }

    const status = this.filterStatus();
    if (status !== 'all') {
      filtered = filtered.filter(user =>
        status === 'active' ? user.isActive : !user.isActive
      );
    }

    const roleId = this.filterRole();
    if (roleId !== 'all') {
      filtered = filtered.filter(user =>
        user.roles.some(r => r.id === roleId)
      );
    }

    this.filteredUsers.set(filtered);
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  onStatusFilterChange(value: 'all' | 'active' | 'inactive'): void {
    this.filterStatus.set(value);
    this.applyFilters();
  }

  onRoleFilterChange(value: string): void {
    this.filterRole.set(value);
    this.applyFilters();
  }

  async toggleUserActive(user: User): Promise<void> {
    const action = user.isActive ? 'desactivar' : 'activar';
    const confirmed = await this.notifications.confirm(`¿Estás seguro de ${action} a ${user.name}?`);
    if (!confirmed) return;

    this.usersService.toggleActive(user.id).subscribe({
      next: (updatedUser) => {
        const index = this.users().findIndex(u => u.id === user.id);
        if (index !== -1) {
          const updated = [...this.users()];
          updated[index] = updatedUser;
          this.users.set(updated);
          this.applyFilters();
        }
        this.notifications.success(`Usuario ${action === 'activar' ? 'activado' : 'desactivado'} correctamente.`);
      },
      error: () => {
        this.notifications.error('Error al cambiar el estado del usuario.');
      }
    });
  }

  getRoleBadgeClass(roleName: string): string {
    const roleMap: Record<string, string> = {
      'Administrador': 'badge-admin',
      'Dentista': 'badge-doctor',
      'Recepcionista': 'badge-receptionist',
      'Asistente': 'badge-assistant'
    };
    return roleMap[roleName] || 'badge-default';
  }

  getRoleIcon(roleName: string): string {
    const iconMap: Record<string, string> = {
      'Administrador': 'fa-user-tie',
      'Dentista': 'fa-user-doctor',
      'Recepcionista': 'fa-clipboard',
      'Asistente': 'fa-user-nurse'
    };
    return iconMap[roleName] || 'fa-user';
  }
}

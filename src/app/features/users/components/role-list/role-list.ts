import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { RolesService } from '../../services/roles.service';
import { UsersService } from '../../services/users.service';
import { Role } from '../../models/role.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent],
  templateUrl: './role-list.html',
  styleUrls: ['./role-list.scss']
})
export class RoleListComponent implements OnInit {
  private rolesService = inject(RolesService);
  private usersService = inject(UsersService);
  private notifications = inject(NotificationService);
  private logger = inject(LoggingService);

  roles = signal<Role[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Usuarios', route: '/users', icon: 'fa-users' },
    { label: 'Roles y Permisos' }
  ];

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.loading.set(true);
    this.error.set(null);

    this.rolesService.getAll().subscribe({
      next: (roles) => {
        this.roles.set(roles);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading roles:', err);
        this.error.set(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  async deleteRole(role: Role): Promise<void> {
    const confirmed = await this.notifications.confirm(`¿Estás seguro de eliminar el rol "${role.name}"?\n\nEsta acción no se puede deshacer.`);
    if (!confirmed) return;

    this.rolesService.delete(role.id).subscribe({
      next: () => {
        const updated = this.roles().filter(r => r.id !== role.id);
        this.roles.set(updated);
        this.notifications.success('Rol eliminado correctamente.');
      },
      error: (err) => {
        if (err.status === 400) {
          this.notifications.warning('No se puede eliminar el rol porque tiene usuarios asignados.');
        } else {
          this.notifications.error(getApiErrorMessage(err));
        }
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
      'Recepcionista': 'fa-clipboard-user',
      'Asistente': 'fa-hands-helping'
    };
    return iconMap[roleName] || 'fa-shield-halved';
  }
}

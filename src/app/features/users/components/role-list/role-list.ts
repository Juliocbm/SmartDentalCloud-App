import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RolesService } from '../../services/roles.service';
import { UsersService } from '../../services/users.service';
import { Role } from '../../models/role.models';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './role-list.html',
  styleUrls: ['./role-list.scss']
})
export class RoleListComponent implements OnInit {
  private rolesService = inject(RolesService);
  private usersService = inject(UsersService);

  roles = signal<Role[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

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
        console.error('Error loading roles:', err);
        this.error.set('Error al cargar roles');
        this.loading.set(false);
      }
    });
  }

  deleteRole(role: Role): void {
    if (confirm(`¿Estás seguro de eliminar el rol "${role.name}"?\n\nEsta acción no se puede deshacer.`)) {
      this.rolesService.delete(role.id).subscribe({
        next: () => {
          const updated = this.roles().filter(r => r.id !== role.id);
          this.roles.set(updated);
        },
        error: (err) => {
          console.error('Error deleting role:', err);
          if (err.status === 400) {
            alert('No se puede eliminar el rol porque tiene usuarios asignados');
          } else {
            alert('Error al eliminar el rol');
          }
        }
      });
    }
  }

  getRoleBadgeClass(roleName: string): string {
    const roleMap: Record<string, string> = {
      'Administrador': 'badge-admin',
      'Odontólogo': 'badge-doctor',
      'Recepcionista': 'badge-receptionist',
      'Asistente': 'badge-assistant'
    };
    return roleMap[roleName] || 'badge-default';
  }

  getRoleIcon(roleName: string): string {
    const iconMap: Record<string, string> = {
      'Administrador': 'fa-user-tie',
      'Odontólogo': 'fa-user-doctor',
      'Recepcionista': 'fa-clipboard-user',
      'Asistente': 'fa-hands-helping'
    };
    return iconMap[roleName] || 'fa-shield-halved';
  }
}

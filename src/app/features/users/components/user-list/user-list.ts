import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../services/users.service';
import { RolesService } from '../../services/roles.service';
import { User, Role } from '../../models/user.models';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './user-list.html',
  styleUrls: ['./user-list.scss']
})
export class UserListComponent implements OnInit {
  private usersService = inject(UsersService);
  private rolesService = inject(RolesService);

  users = signal<User[]>([]);
  filteredUsers = signal<User[]>([]);
  roles = signal<Role[]>([]);
  
  loading = signal(true);
  error = signal<string | null>(null);
  
  searchTerm = signal('');
  filterStatus = signal<'all' | 'active' | 'inactive'>('all');
  filterRole = signal<string>('all');

  ngOnInit(): void {
    this.loadData();
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
        console.error('Error loading data:', err);
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
    this.searchTerm.set(value);
    this.applyFilters();
  }

  onStatusFilterChange(value: 'all' | 'active' | 'inactive'): void {
    this.filterStatus.set(value);
    this.applyFilters();
  }

  onRoleFilterChange(value: string): void {
    this.filterRole.set(value);
    this.applyFilters();
  }

  toggleUserActive(user: User): void {
    if (confirm(`¿Estás seguro de ${user.isActive ? 'desactivar' : 'activar'} a ${user.name}?`)) {
      this.usersService.toggleActive(user.id).subscribe({
        next: (updatedUser) => {
          const index = this.users().findIndex(u => u.id === user.id);
          if (index !== -1) {
            const updated = [...this.users()];
            updated[index] = updatedUser;
            this.users.set(updated);
            this.applyFilters();
          }
        },
        error: (err) => {
          console.error('Error toggling user status:', err);
          alert('Error al cambiar el estado del usuario');
        }
      });
    }
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
      'Administrador': '👨‍💼',
      'Odontólogo': '🩺',
      'Recepcionista': '📋',
      'Asistente': '🤝'
    };
    return iconMap[roleName] || '👤';
  }
}

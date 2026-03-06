import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UsersService } from '../../services/users.service';
import { User } from '../../models/user.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { AuditInfoComponent } from '../../../../shared/components/audit-info/audit-info';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { PermissionService, PERMISSIONS } from '../../../../core/services/permission.service';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent, AuditInfoComponent],
  templateUrl: './user-detail.html',
  styleUrls: ['./user-detail.scss']
})
export class UserDetailComponent implements OnInit {
  showAuditModal = signal(false);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private usersService = inject(UsersService);
  private notifications = inject(NotificationService);
  private logger = inject(LoggingService);
  private location = inject(Location);
  permissionService = inject(PermissionService);

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Usuarios', route: '/users' },
    { label: 'Detalle' }
  ];

  // Tabs
  activeTab = signal<'general' | 'access'>('general');

  // Permissions pagination (client-side)
  permissionsPage = signal(1);
  readonly PERMISSIONS_PAGE_SIZE = 5;

  permissionCategories = computed(() => {
    const u = this.user();
    if (!u?.permissions?.length) return [];
    return Array.from(this.groupPermissionsByCategory(u.permissions).entries())
      .map(([category, perms]) => ({ category, permissions: perms }));
  });

  permissionsTotalPages = computed(() =>
    Math.ceil(this.permissionCategories().length / this.PERMISSIONS_PAGE_SIZE)
  );

  pagedPermissionCategories = computed(() => {
    const all = this.permissionCategories();
    const start = (this.permissionsPage() - 1) * this.PERMISSIONS_PAGE_SIZE;
    return all.slice(start, start + this.PERMISSIONS_PAGE_SIZE);
  });

  user = signal<User | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadUser(id);
    } else {
      this.router.navigate(['/users']);
    }
  }

  private loadUser(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.usersService.getById(id).subscribe({
      next: (user) => {
        this.user.set(user);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading user:', err);
        this.error.set(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  isClinicalUser(): boolean {
    const u = this.user();
    if (!u?.roles) return false;
    const clinicalRoles = ['doctor', 'dentist', 'specialist', 'dentista', 'especialista'];
    return u.roles.some(r => clinicalRoles.includes(r.name.toLowerCase()));
  }

  setActiveTab(tab: 'general' | 'access'): void {
    this.activeTab.set(tab);
  }

  onPermissionsPageChange(page: number): void {
    this.permissionsPage.set(page);
  }

  editUser(): void {
    const user = this.user();
    if (!user) return;
    this.router.navigate(['/users', user.id, 'edit']);
  }

  async toggleUserActive(): Promise<void> {
    const user = this.user();
    if (!user) return;

    const action = user.isActive ? 'desactivar' : 'activar';
    const confirmed = await this.notifications.confirm(`¿Estás seguro de ${action} a ${user.name}?`);
    if (!confirmed) return;

    this.usersService.toggleActive(user.id).subscribe({
      next: (updatedUser) => {
        this.user.set(updatedUser);
        this.notifications.success(`Usuario ${action === 'activar' ? 'activado' : 'desactivado'} correctamente.`);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
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
      'Administrador': '👨‍💼',
      'Odontólogo': '🩺',
      'Recepcionista': '📋',
      'Asistente': '🤝'
    };
    return iconMap[roleName] || '👤';
  }

  getPermissionCategory(permissionKey: string): string {
    const [category] = permissionKey.split('.');
    const categoryMap: Record<string, string> = {
      'patients': 'Pacientes',
      'appointments': 'Citas',
      'treatments': 'Tratamientos',
      'invoices': 'Facturas',
      'payments': 'Pagos',
      'users': 'Usuarios',
      'roles': 'Roles',
      'consultation_notes': 'Notas Clínicas',
      'attached_files': 'Archivos',
      'settings': 'Configuración',
      'reports': 'Reportes',
      'dental_charts': 'Odontograma',
      'treatment_plans': 'Planes de Tratamiento',
      'prescriptions': 'Recetas',
      'notifications': 'Notificaciones',
      'tenants': 'Clínica',
      'suppliers': 'Proveedores',
      'inventory': 'Inventario'
    };
    return categoryMap[category] || category;
  }

  translateAction(permissionKey: string): string {
    const action = permissionKey.split('.')[1];
    const actionMap: Record<string, string> = {
      'view': 'Ver',
      'create': 'Crear',
      'edit': 'Editar',
      'delete': 'Eliminar',
      'cancel': 'Cancelar',
      'cancel_own': 'Cancelar propias',
      'cancel_any': 'Cancelar cualquiera',
      'view_history': 'Ver historial',
      'view_financial': 'Ver financiero',
      'activate': 'Activar',
      'deactivate': 'Desactivar',
      'export': 'Exportar',
      'upload': 'Subir',
      'manage': 'Gestionar',
      'approve': 'Aprobar'
    };
    return actionMap[action] || action;
  }

  groupPermissionsByCategory(permissions: string[]): Map<string, string[]> {
    const grouped = new Map<string, string[]>();
    
    permissions.forEach(permission => {
      const category = this.getPermissionCategory(permission);
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(permission);
    });

    return grouped;
  }
}

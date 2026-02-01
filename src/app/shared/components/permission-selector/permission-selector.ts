import { Component, OnInit, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RolesService } from '../../../features/users/services/roles.service';
import { Permission, PermissionGroup, PERMISSION_CATEGORIES } from '../../../features/users/models/role.models';

@Component({
  selector: 'app-permission-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './permission-selector.html',
  styleUrls: ['./permission-selector.scss']
})
export class PermissionSelectorComponent implements OnInit {
  private rolesService = inject(RolesService);

  @Input() selectedPermissions: string[] = [];
  @Output() permissionsChange = new EventEmitter<string[]>();

  permissionGroups = signal<PermissionGroup[]>([]);
  expandedGroups = signal<Set<string>>(new Set());
  searchTerm = signal('');
  loading = signal(true);

  ngOnInit(): void {
    this.loadPermissions();
  }

  private loadPermissions(): void {
    this.loading.set(true);
    
    this.rolesService.getAllPermissions().subscribe({
      next: (permissions) => {
        const groups = this.groupPermissionsByCategory(permissions);
        this.permissionGroups.set(groups);
        
        // Expandir todos los grupos por defecto
        const allCategories = new Set(groups.map(g => g.category));
        this.expandedGroups.set(allCategories);
        
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading permissions:', err);
        this.loading.set(false);
      }
    });
  }

  private groupPermissionsByCategory(permissions: Permission[]): PermissionGroup[] {
    const grouped = new Map<string, Permission[]>();

    permissions.forEach(permission => {
      const [categoryKey] = permission.key.split('.');
      const categoryName = this.getCategoryName(categoryKey);
      
      if (!grouped.has(categoryName)) {
        grouped.set(categoryName, []);
      }
      grouped.get(categoryName)!.push(permission);
    });

    return Array.from(grouped.entries()).map(([category, perms]) => ({
      category,
      icon: this.getCategoryIcon(category),
      permissions: perms.sort((a, b) => a.key.localeCompare(b.key))
    }));
  }

  private getCategoryName(key: string): string {
    const categoryMap: Record<string, string> = {
      'patients': PERMISSION_CATEGORIES.PATIENTS,
      'appointments': PERMISSION_CATEGORIES.APPOINTMENTS,
      'treatments': PERMISSION_CATEGORIES.TREATMENTS,
      'invoices': PERMISSION_CATEGORIES.INVOICES,
      'payments': PERMISSION_CATEGORIES.PAYMENTS,
      'users': PERMISSION_CATEGORIES.USERS,
      'roles': PERMISSION_CATEGORIES.ROLES,
      'consultation_notes': PERMISSION_CATEGORIES.CONSULTATION_NOTES,
      'attached_files': PERMISSION_CATEGORIES.ATTACHED_FILES,
      'settings': PERMISSION_CATEGORIES.SETTINGS,
      'reports': PERMISSION_CATEGORIES.REPORTS,
      'tenants': PERMISSION_CATEGORIES.TENANTS
    };
    return categoryMap[key] || key;
  }

  private getCategoryIcon(category: string): string {
    const iconMap: Record<string, string> = {
      'Pacientes': '👥',
      'Citas': '📅',
      'Tratamientos': '🦷',
      'Facturas': '🧾',
      'Pagos': '💰',
      'Usuarios': '👤',
      'Roles': '🔑',
      'Notas de Consulta': '📝',
      'Archivos Adjuntos': '📎',
      'Configuración': '⚙️',
      'Reportes': '📊',
      'Tenants': '🏢'
    };
    return iconMap[category] || '📋';
  }

  isPermissionSelected(permissionKey: string): boolean {
    return this.selectedPermissions.includes(permissionKey);
  }

  togglePermission(permissionKey: string): void {
    const current = [...this.selectedPermissions];
    const index = current.indexOf(permissionKey);
    
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(permissionKey);
    }
    
    this.selectedPermissions = current;
    this.permissionsChange.emit(current);
  }

  toggleCategory(category: string): void {
    const expanded = new Set(this.expandedGroups());
    
    if (expanded.has(category)) {
      expanded.delete(category);
    } else {
      expanded.add(category);
    }
    
    this.expandedGroups.set(expanded);
  }

  isCategoryExpanded(category: string): boolean {
    return this.expandedGroups().has(category);
  }

  selectAllInCategory(group: PermissionGroup): void {
    const current = new Set(this.selectedPermissions);
    
    group.permissions.forEach(p => {
      current.add(p.key);
    });
    
    this.selectedPermissions = Array.from(current);
    this.permissionsChange.emit(this.selectedPermissions);
  }

  deselectAllInCategory(group: PermissionGroup): void {
    const keysToRemove = new Set(group.permissions.map(p => p.key));
    const current = this.selectedPermissions.filter(key => !keysToRemove.has(key));
    
    this.selectedPermissions = current;
    this.permissionsChange.emit(current);
  }

  getCategorySelectedCount(group: PermissionGroup): number {
    return group.permissions.filter(p => this.isPermissionSelected(p.key)).length;
  }

  isCategoryFullySelected(group: PermissionGroup): boolean {
    return group.permissions.every(p => this.isPermissionSelected(p.key));
  }

  isCategoryPartiallySelected(group: PermissionGroup): boolean {
    const selected = this.getCategorySelectedCount(group);
    return selected > 0 && selected < group.permissions.length;
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value.toLowerCase());
  }

  getFilteredGroups(): PermissionGroup[] {
    const search = this.searchTerm();
    
    if (!search) {
      return this.permissionGroups();
    }

    return this.permissionGroups()
      .map(group => ({
        ...group,
        permissions: group.permissions.filter(p =>
          p.key.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search)
        )
      }))
      .filter(group => group.permissions.length > 0);
  }

  expandAll(): void {
    const allCategories = new Set(this.permissionGroups().map(g => g.category));
    this.expandedGroups.set(allCategories);
  }

  collapseAll(): void {
    this.expandedGroups.set(new Set());
  }

  selectAll(): void {
    const allKeys = this.permissionGroups()
      .flatMap(g => g.permissions.map(p => p.key));
    
    this.selectedPermissions = allKeys;
    this.permissionsChange.emit(allKeys);
  }

  deselectAll(): void {
    this.selectedPermissions = [];
    this.permissionsChange.emit([]);
  }

  getTotalSelectedCount(): number {
    return this.selectedPermissions.length;
  }

  getTotalPermissionsCount(): number {
    return this.permissionGroups().reduce((sum, g) => sum + g.permissions.length, 0);
  }
}

import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AlertsCountService } from '../../../core/services/alerts-count.service';
import { SidebarStateService } from '../../../core/services/sidebar-state.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserProfileCacheService } from '../../../core/services/user-profile-cache.service';
import { MenuItem } from './sidebar.models';

/**
 * Componente Sidebar con menús colapsables, búsqueda y persistencia
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss']
})
export class SidebarComponent {
  private alertsService = inject(AlertsCountService);
  private sidebarState = inject(SidebarStateService);
  private authService = inject(AuthService);
  private profileCache = inject(UserProfileCacheService);
  private router = inject(Router);

  currentUser = this.authService.currentUser;
  sidebarUserName = computed(() => this.currentUser()?.name || 'Usuario');
  sidebarUserRole = computed(() => {
    const roles = this.currentUser()?.roles;
    return roles && roles.length > 0 ? roles[0] : 'Usuario';
  });
  profilePictureUrl = this.profileCache.profilePictureUrl;

  // Estado del sidebar
  collapsed = this.sidebarState.collapsed;
  searchTerm = this.sidebarState.searchTerm;
  expandedMenus = this.sidebarState.expandedMenus;

  // Menús con IDs únicos
  menuItems = computed<MenuItem[]>(() => [
    { id: 'dashboard', icon: 'fa-solid fa-gauge', label: 'Dashboard', route: '/dashboard' },
    { 
      id: 'patients',
      icon: 'fa-solid fa-users', 
      label: 'Pacientes', 
      route: '/patients/dashboard',
      hasDashboard: true,
      children: [
        { id: 'patients-list', icon: 'fa-solid fa-list', label: 'Pacientes', route: '/patients' },
        { id: 'patients-new', icon: 'fa-solid fa-user-plus', label: 'Nuevo Paciente', route: '/patients/new' }
      ]
    },
    { 
      id: 'appointments',
      icon: 'fa-solid fa-calendar-days', 
      label: 'Citas', 
      route: '/appointments/dashboard',
      hasDashboard: true,
      children: [
        { id: 'appointments-calendar', icon: 'fa-solid fa-calendar', label: 'Calendario', route: '/appointments/calendar' },
        { id: 'appointments-list', icon: 'fa-solid fa-list', label: 'Citas', route: '/appointments' },
        { id: 'appointments-new', icon: 'fa-solid fa-calendar-plus', label: 'Nueva Cita', route: '/appointments/new' }
      ]
    },
    { 
      id: 'treatments',
      icon: 'fa-solid fa-tooth', 
      label: 'Tratamientos', 
      route: '/treatments/dashboard',
      hasDashboard: true,
      children: [
        { id: 'treatments-list', icon: 'fa-solid fa-list', label: 'Tratamientos', route: '/treatments' },
        { id: 'treatments-new', icon: 'fa-solid fa-plus', label: 'Nuevo Tratamiento', route: '/treatments/new' }
      ]
    },
    { 
      id: 'services',
      icon: 'fa-solid fa-briefcase-medical', 
      label: 'Servicios', 
      route: '/services',
      children: [
        { id: 'services-list', icon: 'fa-solid fa-list', label: 'Servicios', route: '/services' },
        { id: 'services-new', icon: 'fa-solid fa-plus', label: 'Nuevo Servicio', route: '/services/new' }
      ]
    },
    { 
      id: 'treatment-plans',
      icon: 'fa-solid fa-clipboard-list', 
      label: 'Planes de Tratamiento', 
      route: '/treatment-plans/dashboard',
      hasDashboard: true,
      children: [
        { id: 'treatment-plans-list', icon: 'fa-solid fa-list', label: 'Planes de Tratamiento', route: '/treatment-plans' },
        { id: 'treatment-plans-new', icon: 'fa-solid fa-plus', label: 'Nuevo Plan de Tratamiento', route: '/treatment-plans/new' }
      ]
    },
    { 
      id: 'prescriptions',
      icon: 'fa-solid fa-prescription', 
      label: 'Recetas', 
      route: '/prescriptions',
      children: [
        { id: 'prescriptions-list', icon: 'fa-solid fa-list', label: 'Recetas', route: '/prescriptions' },
        { id: 'prescriptions-new', icon: 'fa-solid fa-plus', label: 'Nueva Receta', route: '/prescriptions/new' }
      ]
    },
    { 
      id: 'billing',
      icon: 'fa-solid fa-file-invoice-dollar', 
      label: 'Facturación', 
      route: '/invoices',
      hasDashboard: true,
      children: [
        { id: 'billing-invoices', icon: 'fa-solid fa-file-invoice', label: 'Facturas', route: '/invoices/list' },
        { id: 'billing-payments', icon: 'fa-solid fa-money-bill-wave', label: 'Pagos', route: '/payments' },
        { id: 'billing-new-invoice', icon: 'fa-solid fa-plus', label: 'Nueva Factura', route: '/invoices/new' }
      ]
    },
    { 
      id: 'inventory',
      icon: 'fa-solid fa-boxes-stacked', 
      label: 'Inventario', 
      route: '/inventory',
      hasDashboard: true,
      children: [
        { id: 'inventory-products', icon: 'fa-solid fa-box', label: 'Productos', route: '/inventory/products' },
        { id: 'inventory-categories', icon: 'fa-solid fa-tags', label: 'Categorías', route: '/inventory/categories' },
        { 
          id: 'inventory-alerts',
          icon: 'fa-solid fa-triangle-exclamation', 
          label: 'Alertas', 
          route: '/inventory/alerts', 
          badge: this.alertsService.totalAlerts() || undefined
        },
        { id: 'inventory-suppliers', icon: 'fa-solid fa-truck', label: 'Proveedores', route: '/inventory/suppliers' },
        { id: 'inventory-orders', icon: 'fa-solid fa-file-invoice', label: 'Órdenes de Compra', route: '/inventory/purchase-orders' }
      ]
    },
    {
      id: 'dentists',
      icon: 'fa-solid fa-user-doctor',
      label: 'Dentistas',
      route: '/dentists/dashboard',
      hasDashboard: true,
      children: [
        { id: 'dentists-list', icon: 'fa-solid fa-list', label: 'Dentistas', route: '/dentists' }
      ]
    },
    { id: 'users', icon: 'fa-solid fa-user-shield', label: 'Usuarios y Roles', route: '/users' },
    {
      id: 'reports',
      icon: 'fa-solid fa-chart-line',
      label: 'Reportes',
      route: '/reports',
      hasDashboard: true,
      children: [
        { id: 'reports-income', icon: 'fa-solid fa-coins', label: 'Ingresos', route: '/reports/income' },
        { id: 'reports-treatments', icon: 'fa-solid fa-tooth', label: 'Tratamientos', route: '/reports/treatments' },
        { id: 'reports-dentist', icon: 'fa-solid fa-user-doctor', label: 'Productividad', route: '/reports/dentist-productivity' },
        { id: 'reports-receivable', icon: 'fa-solid fa-hand-holding-dollar', label: 'Cuentas por Cobrar', route: '/reports/accounts-receivable' },
        { id: 'reports-inventory', icon: 'fa-solid fa-boxes-stacked', label: 'Inventario', route: '/reports/inventory' },
        { id: 'reports-occupancy', icon: 'fa-solid fa-calendar-check', label: 'Ocupación', route: '/reports/appointment-occupancy' },
        { id: 'reports-top-services', icon: 'fa-solid fa-ranking-star', label: 'Top Servicios', route: '/reports/top-services' }
      ]
    },
    { id: 'settings', icon: 'fa-solid fa-gear', label: 'Configuración', route: '/settings' },
    { id: 'audit-log', icon: 'fa-solid fa-shield-halved', label: 'Auditoría', route: '/audit-log' },
  ]);

  // Menús filtrados por búsqueda
  filteredMenuItems = computed<MenuItem[]>(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.menuItems();
    return this.filterMenuItems(this.menuItems(), term);
  });

  // Indica si hay búsqueda activa
  hasSearchTerm = computed(() => this.searchTerm().trim().length > 0);

  // Cantidad de resultados de búsqueda
  searchResultsCount = computed(() => {
    if (!this.hasSearchTerm()) return 0;
    return this.countMenuItems(this.filteredMenuItems());
  });

  // === Acciones ===

  toggleSidebar(): void {
    this.sidebarState.toggleCollapsed();
  }

  toggleMenu(menuId: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.sidebarState.toggleMenuExpansion(menuId);
  }

  isExpanded(menuId: string): boolean {
    // Si hay búsqueda activa, expandir todos los que tengan resultados
    if (this.hasSearchTerm()) return true;
    return this.sidebarState.isMenuExpanded(menuId);
  }

  hasChildren(item: MenuItem): boolean {
    return !!item.children && item.children.length > 0;
  }

  navigateToRoute(route: string): void {
    this.router.navigate([route]);
  }

  onSearchChange(term: string): void {
    this.sidebarState.setSearchTerm(term);
  }

  clearSearch(): void {
    this.sidebarState.clearSearch();
  }

  // === Helpers privados ===

  private filterMenuItems(items: readonly MenuItem[], term: string): MenuItem[] {
    const result: MenuItem[] = [];

    for (const item of items) {
      const labelMatch = item.label.toLowerCase().includes(term);

      if (item.children && item.children.length > 0) {
        const matchingChildren = item.children.filter(child =>
          child.label.toLowerCase().includes(term)
        );

        if (matchingChildren.length > 0) {
          // Mostrar padre con solo los hijos que coinciden
          result.push({ ...item, children: matchingChildren });
        } else if (labelMatch) {
          // Padre coincide, mostrar con todos los hijos
          result.push(item);
        }
      } else if (labelMatch) {
        result.push(item);
      }
    }

    return result;
  }

  private countMenuItems(items: readonly MenuItem[]): number {
    let count = 0;
    for (const item of items) {
      count++;
      if (item.children) {
        count += item.children.length;
      }
    }
    return count;
  }
}

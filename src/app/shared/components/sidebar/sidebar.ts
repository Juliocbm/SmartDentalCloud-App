import { Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AlertsCountService } from '../../../core/services/alerts-count.service';
import { SidebarStateService } from '../../../core/services/sidebar-state.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserProfileCacheService } from '../../../core/services/user-profile-cache.service';
import { FavoritesService } from '../../../core/services/favorites.service';
import { PermissionService, PERMISSIONS } from '../../../core/services/permission.service';
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
export class SidebarComponent implements OnInit {
  private alertsService = inject(AlertsCountService);
  private sidebarState = inject(SidebarStateService);
  private authService = inject(AuthService);
  private profileCache = inject(UserProfileCacheService);
  private router = inject(Router);
  private permissionService = inject(PermissionService);
  favoritesService = inject(FavoritesService);

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

  // Menús con IDs únicos y permisos requeridos
  menuItems = computed<MenuItem[]>(() => [
    { id: 'dashboard', icon: 'fa-solid fa-gauge', label: 'Dashboard', route: '/dashboard' },
    { 
      id: 'patients',
      icon: 'fa-solid fa-users', 
      label: 'Pacientes', 
      route: '/patients/dashboard',
      hasDashboard: true,
      requiredPermission: PERMISSIONS.PatientsView,
      children: [
        { id: 'patients-list', icon: 'fa-solid fa-list', label: 'Pacientes', route: '/patients', requiredPermission: PERMISSIONS.PatientsView },
        { id: 'patients-new', icon: 'fa-solid fa-user-plus', label: 'Nuevo Paciente', route: '/patients/new', requiredPermission: PERMISSIONS.PatientsCreate }
      ]
    },
    { 
      id: 'appointments',
      icon: 'fa-solid fa-calendar-days', 
      label: 'Citas', 
      route: '/appointments/dashboard',
      hasDashboard: true,
      requiredPermission: PERMISSIONS.AppointmentsView,
      children: [
        { id: 'appointments-calendar', icon: 'fa-solid fa-calendar', label: 'Calendario', route: '/appointments/calendar', requiredPermission: PERMISSIONS.AppointmentsView },
        { id: 'appointments-list', icon: 'fa-solid fa-list', label: 'Citas', route: '/appointments', requiredPermission: PERMISSIONS.AppointmentsView },
        { id: 'appointments-new', icon: 'fa-solid fa-calendar-plus', label: 'Nueva Cita', route: '/appointments/new', requiredPermission: PERMISSIONS.AppointmentsCreate }
      ]
    },
    { 
      id: 'treatments',
      icon: 'fa-solid fa-tooth', 
      label: 'Tratamientos', 
      route: '/treatments/dashboard',
      hasDashboard: true,
      requiredPermission: PERMISSIONS.TreatmentsView,
      children: [
        { id: 'treatments-list', icon: 'fa-solid fa-list', label: 'Ejecutados', route: '/treatments', requiredPermission: PERMISSIONS.TreatmentsView },
        { id: 'treatments-new', icon: 'fa-solid fa-plus', label: 'Nuevo Tratamiento', route: '/treatments/new', requiredPermission: PERMISSIONS.TreatmentsCreate },
        { id: 'treatment-plans-list', icon: 'fa-solid fa-clipboard-list', label: 'Planes de Tratamiento', route: '/treatment-plans', requiredPermission: PERMISSIONS.TreatmentPlansView },
        { id: 'treatment-plans-new', icon: 'fa-solid fa-file-circle-plus', label: 'Nuevo Plan', route: '/treatment-plans/new', requiredPermission: PERMISSIONS.TreatmentPlansCreate }
      ]
    },
    { 
      id: 'services',
      icon: 'fa-solid fa-briefcase-medical', 
      label: 'Servicios', 
      route: '/services',
      requiredPermission: PERMISSIONS.TreatmentsView,
      children: [
        { id: 'services-list', icon: 'fa-solid fa-list', label: 'Servicios', route: '/services', requiredPermission: PERMISSIONS.TreatmentsView },
        { id: 'services-new', icon: 'fa-solid fa-plus', label: 'Nuevo Servicio', route: '/services/new', requiredPermission: PERMISSIONS.TreatmentsCreate }
      ]
    },
    { 
      id: 'prescriptions',
      icon: 'fa-solid fa-prescription', 
      label: 'Recetas', 
      route: '/prescriptions',
      requiredPermission: PERMISSIONS.PrescriptionsView,
      children: [
        { id: 'prescriptions-list', icon: 'fa-solid fa-list', label: 'Recetas', route: '/prescriptions', requiredPermission: PERMISSIONS.PrescriptionsView },
        { id: 'prescriptions-new', icon: 'fa-solid fa-plus', label: 'Nueva Receta', route: '/prescriptions/new', requiredPermission: PERMISSIONS.PrescriptionsCreate }
      ]
    },
    { 
      id: 'billing',
      icon: 'fa-solid fa-file-invoice-dollar', 
      label: 'Facturación', 
      route: '/invoices',
      hasDashboard: true,
      requiredPermission: PERMISSIONS.InvoicesView,
      children: [
        { id: 'billing-invoices', icon: 'fa-solid fa-file-invoice', label: 'Facturas', route: '/invoices/list', requiredPermission: PERMISSIONS.InvoicesView },
        { id: 'billing-payments', icon: 'fa-solid fa-money-bill-wave', label: 'Pagos', route: '/payments', requiredPermission: PERMISSIONS.PaymentsView },
        { id: 'billing-new-invoice', icon: 'fa-solid fa-plus', label: 'Nueva Factura', route: '/invoices/new', requiredPermission: PERMISSIONS.InvoicesCreate }
      ]
    },
    { 
      id: 'inventory',
      icon: 'fa-solid fa-boxes-stacked', 
      label: 'Inventario', 
      route: '/inventory',
      hasDashboard: true,
      requiredPermission: PERMISSIONS.InventoryView,
      children: [
        { id: 'inventory-products', icon: 'fa-solid fa-box', label: 'Productos', route: '/inventory/products', requiredPermission: PERMISSIONS.InventoryView },
        { id: 'inventory-categories', icon: 'fa-solid fa-tags', label: 'Categorías', route: '/inventory/categories', requiredPermission: PERMISSIONS.InventoryView },
        { 
          id: 'inventory-alerts',
          icon: 'fa-solid fa-triangle-exclamation', 
          label: 'Alertas', 
          route: '/inventory/alerts', 
          badge: this.alertsService.totalAlerts() || undefined,
          requiredPermission: PERMISSIONS.InventoryView
        },
        { id: 'inventory-suppliers', icon: 'fa-solid fa-truck', label: 'Proveedores', route: '/inventory/suppliers', requiredPermission: PERMISSIONS.InventoryView },
        { id: 'inventory-orders', icon: 'fa-solid fa-file-invoice', label: 'Órdenes de Compra', route: '/inventory/purchase-orders', requiredPermission: PERMISSIONS.InventoryView }
      ]
    },
    {
      id: 'dentists',
      icon: 'fa-solid fa-user-doctor',
      label: 'Dentistas',
      route: '/dentists/dashboard',
      hasDashboard: true,
      requiredPermission: PERMISSIONS.UsersView,
      children: [
        { id: 'dentists-list', icon: 'fa-solid fa-list', label: 'Dentistas', route: '/dentists', requiredPermission: PERMISSIONS.UsersView }
      ]
    },
    { id: 'users', icon: 'fa-solid fa-user-shield', label: 'Usuarios y Roles', route: '/users', requiredPermission: PERMISSIONS.UsersView },
    {
      id: 'reports',
      icon: 'fa-solid fa-chart-line',
      label: 'Reportes',
      route: '/reports',
      hasDashboard: true,
      requiredPermission: PERMISSIONS.ReportsView,
      children: [
        { id: 'reports-income', icon: 'fa-solid fa-coins', label: 'Ingresos', route: '/reports/income', requiredPermission: PERMISSIONS.ReportsView },
        { id: 'reports-treatments', icon: 'fa-solid fa-tooth', label: 'Tratamientos', route: '/reports/treatments', requiredPermission: PERMISSIONS.ReportsView },
        { id: 'reports-dentist', icon: 'fa-solid fa-user-doctor', label: 'Productividad', route: '/reports/dentist-productivity', requiredPermission: PERMISSIONS.ReportsView },
        { id: 'reports-receivable', icon: 'fa-solid fa-hand-holding-dollar', label: 'Cuentas por Cobrar', route: '/reports/accounts-receivable', requiredPermission: PERMISSIONS.ReportsView },
        { id: 'reports-inventory', icon: 'fa-solid fa-boxes-stacked', label: 'Inventario', route: '/reports/inventory', requiredPermission: PERMISSIONS.ReportsView },
        { id: 'reports-occupancy', icon: 'fa-solid fa-calendar-check', label: 'Ocupación', route: '/reports/appointment-occupancy', requiredPermission: PERMISSIONS.ReportsView },
        { id: 'reports-top-services', icon: 'fa-solid fa-ranking-star', label: 'Top Servicios', route: '/reports/top-services', requiredPermission: PERMISSIONS.ReportsView }
      ]
    },
    {
      id: 'settings',
      icon: 'fa-solid fa-gear',
      label: 'Configuración',
      route: '/settings',
      requiredPermission: PERMISSIONS.SettingsView,
      children: [
        { id: 'settings-general', icon: 'fa-solid fa-sliders', label: 'General', route: '/settings', requiredPermission: PERMISSIONS.SettingsView },
        { id: 'settings-subscription', icon: 'fa-solid fa-crown', label: 'Suscripción', route: '/subscription' }
      ]
    },
    { id: 'audit-log', icon: 'fa-solid fa-shield-halved', label: 'Auditoría', route: '/audit-log', requiredPermission: PERMISSIONS.SettingsView },
  ]);

  // Menús filtrados por permisos del usuario
  visibleMenuItems = computed<MenuItem[]>(() => {
    return this.filterByPermissions(this.menuItems());
  });

  // Menú de favoritos dinámico (usa visibleMenuItems)
  favoriteMenuItems = computed<MenuItem[]>(() => {
    const favIds = this.favoritesService.favorites();
    if (favIds.length === 0) return [];

    const allItems = this.visibleMenuItems();
    const favChildren: MenuItem[] = [];

    for (const item of allItems) {
      if (favIds.includes(item.id)) {
        favChildren.push({ id: item.id, icon: item.icon, label: item.label, route: item.route });
      }
      if (item.children) {
        for (const child of item.children) {
          if (favIds.includes(child.id)) {
            favChildren.push({ id: child.id, icon: child.icon, label: child.label, route: child.route });
          }
        }
      }
    }

    return favChildren;
  });

  // Menús filtrados por búsqueda (usa visibleMenuItems como base)
  filteredMenuItems = computed<MenuItem[]>(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.visibleMenuItems();
    return this.filterMenuItems(this.visibleMenuItems(), term);
  });

  // Indica si hay búsqueda activa
  hasSearchTerm = computed(() => this.searchTerm().trim().length > 0);

  // Cantidad de resultados de búsqueda
  searchResultsCount = computed(() => {
    if (!this.hasSearchTerm()) return 0;
    return this.countMenuItems(this.filteredMenuItems());
  });

  ngOnInit(): void {
    this.favoritesService.loadFavorites();
  }

  // === Acciones ===

  toggleFavorite(menuItemId: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.favoritesService.toggleFavorite(menuItemId);
  }

  isFavorite(menuItemId: string): boolean {
    return this.favoritesService.isFavorite(menuItemId);
  }

  toggleSidebar(): void {
    this.sidebarState.toggleCollapsed();
  }

  toggleMenu(menuId: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    // Si está colapsado, expandir sidebar y abrir este menú
    if (this.collapsed()) {
      this.sidebarState.setCollapsed(false);
      this.sidebarState.expandMenu(menuId);
      return;
    }

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

  private filterByPermissions(items: readonly MenuItem[]): MenuItem[] {
    return items
      .filter(item => {
        if (!item.requiredPermission) return true;
        return this.permissionService.hasPermission(item.requiredPermission);
      })
      .map(item => {
        if (!item.children || item.children.length === 0) return item;
        const filteredChildren = item.children.filter(child => {
          if (!child.requiredPermission) return true;
          return this.permissionService.hasPermission(child.requiredPermission);
        });
        return { ...item, children: filteredChildren };
      });
  }

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

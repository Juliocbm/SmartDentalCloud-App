import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface MenuItem {
  icon: string;
  label: string;
  route: string;
  badge?: number;
  children?: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss']
})
export class SidebarComponent {
  collapsed = signal(false);
  
  menuItems: MenuItem[] = [
    { icon: 'fa-solid fa-gauge', label: 'Dashboard', route: '/dashboard' },
    { icon: 'fa-solid fa-users', label: 'Pacientes', route: '/patients' },
    { icon: 'fa-solid fa-calendar-days', label: 'Citas', route: '/appointments', badge: 3 },
    { icon: 'fa-solid fa-tooth', label: 'Tratamientos', route: '/treatments' },
    { icon: 'fa-solid fa-file-invoice-dollar', label: 'Facturación', route: '/billing' },
    { 
      icon: 'fa-solid fa-boxes-stacked', 
      label: 'Inventario', 
      route: '/inventory',
      children: [
        { icon: 'fa-solid fa-box', label: 'Productos', route: '/inventory/products' },
        { icon: 'fa-solid fa-tags', label: 'Categorías', route: '/inventory/categories' },
        { icon: 'fa-solid fa-triangle-exclamation', label: 'Alertas', route: '/inventory/alerts', badge: 0 },
        { icon: 'fa-solid fa-truck', label: 'Proveedores', route: '/inventory/suppliers' },
        { icon: 'fa-solid fa-file-invoice', label: 'Órdenes de Compra', route: '/inventory/purchase-orders' }
      ]
    },
    { icon: 'fa-solid fa-user-doctor', label: 'Dentistas', route: '/dentists' },
    { icon: 'fa-solid fa-user-shield', label: 'Usuarios y Roles', route: '/users' },
    { icon: 'fa-solid fa-chart-line', label: 'Reportes', route: '/reports' },
    { icon: 'fa-solid fa-gear', label: 'Configuración', route: '/settings' },
  ];

  toggleSidebar(): void {
    this.collapsed.update(value => !value);
  }
}

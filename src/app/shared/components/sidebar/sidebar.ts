import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface MenuItem {
  icon: string;
  label: string;
  route: string;
  badge?: number;
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
    { icon: 'fa-solid fa-boxes-stacked', label: 'Inventario', route: '/inventory' },
    { icon: 'fa-solid fa-user-doctor', label: 'Dentistas', route: '/dentists' },
    { icon: 'fa-solid fa-user-shield', label: 'Usuarios y Roles', route: '/users' },
    { icon: 'fa-solid fa-chart-line', label: 'Reportes', route: '/reports' },
    { icon: 'fa-solid fa-gear', label: 'Configuración', route: '/settings' },
  ];

  toggleSidebar(): void {
    this.collapsed.update(value => !value);
  }
}

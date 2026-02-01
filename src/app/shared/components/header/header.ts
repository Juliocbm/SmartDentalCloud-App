import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, ThemeToggleComponent],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class HeaderComponent {
  showNotifications = false;
  showUserMenu = false;

  notifications = [
    { id: 1, message: 'Nueva cita programada', time: 'Hace 5 min', unread: true },
    { id: 2, message: 'Pago recibido', time: 'Hace 1 hora', unread: true },
    { id: 3, message: 'Recordatorio de cita', time: 'Hace 2 horas', unread: false },
  ];

  get unreadCount(): number {
    return this.notifications.filter(n => n.unread).length;
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    this.showUserMenu = false;
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
    this.showNotifications = false;
  }

  logout(): void {
    console.log('Logout');
  }
}

import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle';
import { AuthService } from '../../../core/services/auth.service';
import { LoggingService } from '../../../core/services/logging.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, ThemeToggleComponent],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private logger = inject(LoggingService);

  showNotifications = false;
  showUserMenu = false;

  currentUser = this.authService.currentUser;
  userName = computed(() => this.currentUser()?.name || 'Usuario');
  userEmail = computed(() => this.currentUser()?.email || '');

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
    this.authService.logout().subscribe({
      next: () => {
        // Navegación al login se maneja en el servicio
      },
      error: (error) => {
        this.logger.error('Error during logout:', error);
        // Aún así limpiar sesión local
        localStorage.clear();
        window.location.href = '/login';
      }
    });
  }
}

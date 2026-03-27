import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle';
import { FormAlertComponent } from '../../../shared/components/form-alert/form-alert';
import { getApiErrorMessage } from '../../../core/utils/api-error.utils';

@Component({
  selector: 'app-force-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule, ThemeToggleComponent, FormAlertComponent],
  templateUrl: './force-change-password.html',
  styleUrl: './force-change-password.scss'
})
export class ForceChangePasswordComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  currentPassword = signal('');
  newPassword = signal('');
  confirmPassword = signal('');
  showCurrentPassword = signal(false);
  showNewPassword = signal(false);
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  toggleCurrentPasswordVisibility(): void {
    this.showCurrentPassword.update(v => !v);
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword.update(v => !v);
  }

  isFormValid(): boolean {
    return this.currentPassword().length >= 1 &&
      this.newPassword().length >= 8 &&
      this.newPassword() === this.confirmPassword();
  }

  passwordsMatch(): boolean {
    return this.confirmPassword().length === 0 || this.newPassword() === this.confirmPassword();
  }

  onSubmit(): void {
    if (!this.isFormValid() || this.loading()) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.changePassword({
      currentPassword: this.currentPassword(),
      newPassword: this.newPassword(),
      confirmPassword: this.confirmPassword()
    }).subscribe({
      next: (result) => {
        if (result.success) {
          // Si el backend envió tokens limpios, actualizar la sesión
          if (result.newSession) {
            this.authService.updateSession(result.newSession);
          }
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage.set(result.message || 'Error al cambiar la contraseña.');
          this.loading.set(false);
        }
      },
      error: (err) => {
        this.errorMessage.set(getApiErrorMessage(err, 'Error al cambiar la contraseña.'));
        this.loading.set(false);
      }
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {},
      error: () => this.authService.handleLogout()
    });
  }
}

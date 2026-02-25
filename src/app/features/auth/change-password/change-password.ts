import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';
import { getApiErrorMessage } from '../../../core/utils/api-error.utils';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PageHeaderComponent],
  templateUrl: './change-password.html',
  styleUrl: './change-password.scss'
})
export class ChangePasswordComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private notifications = inject(NotificationService);

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
    return this.currentPassword().length > 0 &&
      this.newPassword().length >= 6 &&
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
          this.notifications.success('Contraseña actualizada exitosamente');
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage.set(result.message || 'Error al cambiar la contraseña.');
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(getApiErrorMessage(err, 'Error al cambiar la contraseña. Verifica tu contraseña actual.'));
        this.loading.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}

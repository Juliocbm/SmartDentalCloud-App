import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ThemeToggleComponent],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss'
})
export class ResetPasswordComponent implements OnInit {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  token = signal('');
  newPassword = signal('');
  confirmPassword = signal('');
  showPassword = signal(false);
  loading = signal(false);
  success = signal(false);
  errorMessage = signal<string | null>(null);
  tokenValid = signal(true);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.tokenValid.set(false);
      return;
    }
    this.token.set(token);
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  isFormValid(): boolean {
    return this.newPassword().length >= 6 &&
      this.newPassword() === this.confirmPassword();
  }

  passwordsMatch(): boolean {
    return this.confirmPassword().length === 0 || this.newPassword() === this.confirmPassword();
  }

  onSubmit(): void {
    if (!this.isFormValid() || this.loading()) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.resetPassword({
      token: this.token(),
      newPassword: this.newPassword(),
      confirmPassword: this.confirmPassword()
    }).subscribe({
      next: (result) => {
        if (result.success) {
          this.success.set(true);
        } else {
          this.errorMessage.set(result.message || 'Error al restablecer la contraseña.');
        }
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Error al restablecer la contraseña. El enlace puede haber expirado.');
        this.loading.set(false);
      }
    });
  }
}

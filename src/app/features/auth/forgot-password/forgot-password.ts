import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ThemeToggleComponent],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss'
})
export class ForgotPasswordComponent {
  private authService = inject(AuthService);

  email = signal('');
  loading = signal(false);
  success = signal(false);
  errorMessage = signal<string | null>(null);

  onSubmit(): void {
    if (!this.email().trim() || this.loading()) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.forgotPassword({ email: this.email().trim() }).subscribe({
      next: () => {
        this.success.set(true);
        this.loading.set(false);
      },
      error: () => {
        // Always show success to prevent email enumeration
        this.success.set(true);
        this.loading.set(false);
      }
    });
  }
}

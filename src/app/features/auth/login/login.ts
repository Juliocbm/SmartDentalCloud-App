import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NavigationStateService } from '../../../core/services/navigation-state.service';
import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle';
import { FormAlertComponent } from '../../../shared/components/form-alert/form-alert';
import { getApiErrorMessage } from '../../../core/utils/api-error.utils';
import { markFormGroupTouched, isFieldInvalid, getFieldError } from '../../../core/utils/form-error.utils';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ThemeToggleComponent, FormAlertComponent],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private navigationState = inject(NavigationStateService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm: FormGroup;
  loading = signal(false);
  errorMessage = signal<string | null>(null);
  showPassword = signal(false);
  rememberMe = signal(false);

  constructor() {
    const savedEmail = this.authService.getSavedEmail();
    const wasRemembered = this.authService.getRememberMe();

    this.rememberMe.set(wasRemembered);
    this.loginForm = this.fb.group({
      email: [savedEmail, [Validators.required, Validators.email]],
      password: ['Entrar240992*', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      markFormGroupTouched(this.loginForm);
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const credentials = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    this.authService.login(credentials, this.rememberMe()).subscribe({
      next: (response) => {
        if (response.user.mustChangePassword) {
          this.router.navigate(['/force-change-password']);
        } else {
          const returnUrl = this.route.snapshot.queryParams['returnUrl']
            || this.navigationState.getState()?.url
            || '/dashboard';
          this.router.navigateByUrl(returnUrl);
        }
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 401) {
          this.errorMessage.set('Email o contraseña incorrectos');
        } else {
          this.errorMessage.set(getApiErrorMessage(err));
        }
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(value => !value);
  }

  isFieldInvalid(field: string): boolean {
    return isFieldInvalid(this.loginForm, field);
  }

  getFieldError(field: string): string | null {
    return getFieldError(this.loginForm, field);
  }
}

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { LoginComponent } from './login';
import { AuthService } from '../../../core/services/auth.service';
import { of, throwError } from 'rxjs';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: AuthService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a login form with email and password', () => {
    expect(component.loginForm.contains('email')).toBeTrue();
    expect(component.loginForm.contains('password')).toBeTrue();
  });

  it('should start with loading false', () => {
    expect(component.loading()).toBeFalse();
  });

  it('should start with no error message', () => {
    expect(component.errorMessage()).toBeNull();
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword()).toBeFalse();
    component.togglePasswordVisibility();
    expect(component.showPassword()).toBeTrue();
    component.togglePasswordVisibility();
    expect(component.showPassword()).toBeFalse();
  });

  it('should not submit if form is invalid', () => {
    component.loginForm.patchValue({ email: '', password: '' });
    spyOn(authService, 'login');
    component.onSubmit();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('should set error on 401 response', () => {
    component.loginForm.patchValue({ email: 'test@test.com', password: '123456' });
    spyOn(authService, 'login').and.returnValue(throwError(() => ({ status: 401 })));
    component.onSubmit();
    expect(component.errorMessage()).toBe('Email o contraseña incorrectos');
    expect(component.loading()).toBeFalse();
  });

  it('should navigate to dashboard on successful login', () => {
    component.loginForm.patchValue({ email: 'test@test.com', password: '123456' });
    spyOn(authService, 'login').and.returnValue(of({} as any));
    spyOn(router, 'navigate');
    component.onSubmit();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});

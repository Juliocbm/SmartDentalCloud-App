import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';
import {
  LoginRequest,
  LoginResponse,
  UserInfo,
  RefreshTokenRequest,
  LogoutRequest,
  ChangePasswordRequest,
  ChangePasswordResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest
} from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiService = inject(ApiService);
  private router = inject(Router);

  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'current_user';
  private readonly TOKEN_EXPIRY_KEY = 'token_expiry';

  currentUser = signal<UserInfo | null>(this.getUserFromStorage());
  isAuthenticated = signal<boolean>(this.hasValidToken());

  private authStateSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  authState$ = this.authStateSubject.asObservable();

  constructor() {
    this.checkTokenExpiry();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.apiService.post<LoginResponse>('/auth/login', credentials).pipe(
      tap(response => {
        this.setSession(response);
        this.currentUser.set(response.user);
        this.isAuthenticated.set(true);
        this.authStateSubject.next(true);
      })
    );
  }

  logout(): Observable<void> {
    const refreshToken = this.getRefreshToken();
    const request: LogoutRequest = { refreshToken: refreshToken || '' };

    return this.apiService.post<void>('/auth/logout', request).pipe(
      tap(() => {
        this.clearSession();
        this.currentUser.set(null);
        this.isAuthenticated.set(false);
        this.authStateSubject.next(false);
        this.router.navigate(['/login']);
      })
    );
  }

  refreshToken(): Observable<LoginResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const request: RefreshTokenRequest = { refreshToken };

    return this.apiService.post<LoginResponse>('/auth/refresh', request).pipe(
      tap(response => {
        this.setSession(response);
        this.currentUser.set(response.user);
        this.isAuthenticated.set(true);
        this.authStateSubject.next(true);
      })
    );
  }

  changePassword(request: ChangePasswordRequest): Observable<ChangePasswordResponse> {
    return this.apiService.post<ChangePasswordResponse>('/auth/change-password', request);
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<{ message: string }> {
    return this.apiService.post<{ message: string }>('/auth/forgot-password', request);
  }

  resetPassword(request: ResetPasswordRequest): Observable<ChangePasswordResponse> {
    return this.apiService.post<ChangePasswordResponse>('/auth/reset-password', request);
  }

  validateResetToken(token: string): Observable<{ isValid: boolean }> {
    return this.apiService.get<{ isValid: boolean }>('/auth/validate-reset-token', { token });
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  getCurrentUser(): UserInfo | null {
    return this.currentUser();
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.roles?.includes(role) ?? false;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return roles.some(role => user?.roles?.includes(role) ?? false);
  }

  private setSession(authResult: LoginResponse): void {
    localStorage.setItem(this.TOKEN_KEY, authResult.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, authResult.refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(authResult.user));
    localStorage.setItem(this.TOKEN_EXPIRY_KEY, authResult.expiresAt);
  }

  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
  }

  private getUserFromStorage(): UserInfo | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch {
        return null;
      }
    }
    return null;
  }

  private hasValidToken(): boolean {
    const token = this.getToken();
    const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    
    if (!token || !expiry) {
      return false;
    }

    const expiryDate = new Date(expiry);
    return expiryDate > new Date();
  }

  private checkTokenExpiry(): void {
    setInterval(() => {
      if (!this.hasValidToken() && this.isAuthenticated()) {
        console.warn('Token expired, logging out...');
        this.clearSession();
        this.currentUser.set(null);
        this.isAuthenticated.set(false);
        this.authStateSubject.next(false);
        this.router.navigate(['/login']);
      }
    }, 60000); // Check every minute
  }
}

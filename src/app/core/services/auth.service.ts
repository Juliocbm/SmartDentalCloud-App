import { Injectable, Injector, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { LoggingService } from './logging.service';
import { EntitlementService } from './entitlement.service';
import { FavoritesService } from './favorites.service';
import { AlertsCountService } from './alerts-count.service';
import { UserProfileCacheService } from './user-profile-cache.service';
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
  private logger = inject(LoggingService);
  private injector = inject(Injector);
  private entitlementService = inject(EntitlementService);
  private favoritesService = inject(FavoritesService);
  private alertsCountService = inject(AlertsCountService);

  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'current_user';
  private readonly TOKEN_EXPIRY_KEY = 'token_expiry';
  private readonly REMEMBER_ME_KEY = 'remember_me';
  private readonly SAVED_EMAIL_KEY = 'saved_email';

  currentUser = signal<UserInfo | null>(this.getUserFromStorage());
  isAuthenticated = signal<boolean>(this.hasValidToken());
  mustChangePassword = computed(() => this.currentUser()?.mustChangePassword ?? false);

  private tokenCheckInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startTokenExpiryCheck();
  }

  login(credentials: LoginRequest, rememberMe: boolean = false): Observable<LoginResponse> {
    return this.apiService.post<LoginResponse>('/auth/login', credentials).pipe(
      tap(response => {
        this.setRememberMe(rememberMe);
        if (rememberMe) {
          localStorage.setItem(this.SAVED_EMAIL_KEY, credentials.email);
        } else {
          localStorage.removeItem(this.SAVED_EMAIL_KEY);
        }
        this.setSession(response);
        this.currentUser.set(response.user);
        this.isAuthenticated.set(true);
      })
    );
  }

  getRememberMe(): boolean {
    return localStorage.getItem(this.REMEMBER_ME_KEY) === 'true';
  }

  getSavedEmail(): string {
    return localStorage.getItem(this.SAVED_EMAIL_KEY) || '';
  }

  private setRememberMe(value: boolean): void {
    localStorage.setItem(this.REMEMBER_ME_KEY, value ? 'true' : 'false');
  }

  private getStorage(): Storage {
    return this.getRememberMe() ? localStorage : sessionStorage;
  }

  logout(): Observable<void> {
    const refreshToken = this.getRefreshToken();
    const request: LogoutRequest = { refreshToken: refreshToken || '' };

    return this.apiService.post<void>('/auth/logout', request).pipe(
      tap(() => {
        this.handleLogout();
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
      })
    );
  }

  changePassword(request: ChangePasswordRequest): Observable<ChangePasswordResponse> {
    return this.apiService.post<ChangePasswordResponse>('/auth/change-password', request);
  }

  /** Actualiza la sesión con tokens limpios post-cambio forzado de contraseña */
  updateSession(newSession: LoginResponse): void {
    this.setSession(newSession);
    this.currentUser.set(newSession.user);
    this.isAuthenticated.set(true);
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
    return this.getStorage().getItem(this.TOKEN_KEY)
      || localStorage.getItem(this.TOKEN_KEY)
      || sessionStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return this.getStorage().getItem(this.REFRESH_TOKEN_KEY)
      || localStorage.getItem(this.REFRESH_TOKEN_KEY)
      || sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
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
    const storage = this.getStorage();
    storage.setItem(this.TOKEN_KEY, authResult.accessToken);
    storage.setItem(this.REFRESH_TOKEN_KEY, authResult.refreshToken);
    storage.setItem(this.USER_KEY, JSON.stringify(authResult.user));
    storage.setItem(this.TOKEN_EXPIRY_KEY, authResult.expiresAt);
  }

  private clearSession(): void {
    // Limpiar ambos storages para asegurar limpieza completa
    [localStorage, sessionStorage].forEach(storage => {
      storage.removeItem(this.TOKEN_KEY);
      storage.removeItem(this.REFRESH_TOKEN_KEY);
      storage.removeItem(this.USER_KEY);
      storage.removeItem(this.TOKEN_EXPIRY_KEY);
    });
  }

  /**
   * Limpia la sesión anterior y establece el token del nuevo tenant post-registro.
   * Usado exclusivamente por el flujo de registro (Onboarding).
   * ON-BUG-001: evita que el JWT de un tenant anterior contamine el nuevo tenant.
   */
  setRegistrationToken(accessToken: string): void {
    // Limpiar AMBOS storages para eliminar cualquier sesión anterior
    [localStorage, sessionStorage].forEach(storage => {
      storage.removeItem(this.TOKEN_KEY);
      storage.removeItem(this.REFRESH_TOKEN_KEY);
      storage.removeItem(this.USER_KEY);
      storage.removeItem(this.TOKEN_EXPIRY_KEY);
    });
    // Guardar el nuevo token en localStorage con rememberMe=true
    // para que el interceptor siempre lo encuentre como primera opción
    localStorage.setItem(this.REMEMBER_ME_KEY, 'true');
    localStorage.setItem(this.TOKEN_KEY, accessToken);
    // Establecer expiración (30 min, igual que login) para que hasValidToken()
    // retorne true y el check periódico no fuerce logout
    const expiry = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiry);
    this.isAuthenticated.set(true);
    // Obtener info del usuario inmediatamente con el nuevo token
    this.fetchCurrentUser().subscribe({
      error: () => this.currentUser.set(null)
    });
  }

  /**
   * Obtiene la info del usuario autenticado desde el backend.
   * Usado post-registro y como red de seguridad cuando currentUser es null pero hay token válido.
   */
  fetchCurrentUser(): Observable<UserInfo> {
    return this.apiService.get<UserInfo>('/auth/me').pipe(
      tap(user => {
        this.currentUser.set(user);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      })
    );
  }

  private getUserFromStorage(): UserInfo | null {
    const userJson = this.getStorage().getItem(this.USER_KEY)
      || localStorage.getItem(this.USER_KEY)
      || sessionStorage.getItem(this.USER_KEY);
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
    const expiry = this.getStorage().getItem(this.TOKEN_EXPIRY_KEY)
      || localStorage.getItem(this.TOKEN_EXPIRY_KEY)
      || sessionStorage.getItem(this.TOKEN_EXPIRY_KEY);
    
    if (!token || !expiry) {
      return false;
    }

    const expiryDate = new Date(expiry);
    return expiryDate > new Date();
  }

  /**
   * Limpia sesión y redirige al login.
   * Usado internamente y por authInterceptor.
   */
  handleLogout(): void {
    this.clearNavigationState();
    this.clearSession();
    this.currentUser.set(null);
    this.isAuthenticated.set(false);

    // Resetear caches de servicios con estado independiente
    // (PermissionService y FeatureService auto-cascadean via computed signals)
    this.entitlementService.reset();
    this.injector.get(UserProfileCacheService).reset();  // lazy inject — evita DI circular
    this.favoritesService.reset();
    this.alertsCountService.reset();

    this.router.navigate(['/login']);
  }

  private clearNavigationState(): void {
    const keysToRemove = Object.keys(localStorage).filter(k =>
      k.startsWith('nav_state_') || k.startsWith('nav_tabs_')
    );
    keysToRemove.forEach(k => localStorage.removeItem(k));
  }

  private startTokenExpiryCheck(): void {
    this.tokenCheckInterval = setInterval(() => {
      if (!this.hasValidToken() && this.isAuthenticated()) {
        this.logger.warn('Token expired, logging out...');
        this.handleLogout();
      }
    }, 60000);
  }
}

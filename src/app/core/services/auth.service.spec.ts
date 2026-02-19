import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start unauthenticated when no token exists', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });

  it('should return null token when not logged in', () => {
    expect(service.getToken()).toBeNull();
    expect(service.getRefreshToken()).toBeNull();
  });

  it('should login and set session', () => {
    const mockResponse = {
      accessToken: 'test-token',
      refreshToken: 'test-refresh',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      user: { id: '1', name: 'Test', email: 'test@test.com', roles: ['Admin'] }
    };

    service.login({ email: 'test@test.com', password: 'pass' }).subscribe(response => {
      expect(response.accessToken).toBe('test-token');
      expect(service.isAuthenticated()).toBe(true);
      expect(service.currentUser()?.name).toBe('Test');
      expect(service.getToken()).toBe('test-token');
      expect(service.getRefreshToken()).toBe('test-refresh');
    });

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should handleLogout and clear session', () => {
    localStorage.setItem('access_token', 'token');
    localStorage.setItem('refresh_token', 'refresh');
    localStorage.setItem('current_user', '{}');
    localStorage.setItem('token_expiry', new Date().toISOString());

    service.handleLogout();

    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
    expect(service.getToken()).toBeNull();
    expect(service.getRefreshToken()).toBeNull();
  });

  it('should refresh token and update session', () => {
    localStorage.setItem('refresh_token', 'old-refresh');

    const mockResponse = {
      accessToken: 'new-token',
      refreshToken: 'new-refresh',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      user: { id: '1', name: 'Test', email: 'test@test.com', roles: ['Admin'] }
    };

    service.refreshToken().subscribe(response => {
      expect(response.accessToken).toBe('new-token');
      expect(service.isAuthenticated()).toBe(true);
      expect(service.getToken()).toBe('new-token');
    });

    const req = httpMock.expectOne('/api/auth/refresh');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.refreshToken).toBe('old-refresh');
    req.flush(mockResponse);
  });

  it('should throw when refreshing without refresh token', () => {
    expect(() => service.refreshToken()).toThrowError('No refresh token available');
  });

  it('should check roles correctly', () => {
    const mockResponse = {
      accessToken: 'token',
      refreshToken: 'refresh',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      user: { id: '1', name: 'Test', email: 'test@test.com', roles: ['Admin', 'Dentista'] }
    };

    service.login({ email: 'test@test.com', password: 'pass' }).subscribe(() => {
      expect(service.hasRole('Admin')).toBe(true);
      expect(service.hasRole('Recepcionista')).toBe(false);
      expect(service.hasAnyRole(['Admin', 'Recepcionista'])).toBe(true);
      expect(service.hasAnyRole(['Recepcionista'])).toBe(false);
    });

    const req = httpMock.expectOne('/api/auth/login');
    req.flush(mockResponse);
  });
});

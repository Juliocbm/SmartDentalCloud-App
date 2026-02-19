import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let authService: AuthService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should add Authorization header when token exists', () => {
    spyOn(authService, 'getToken').and.returnValue('test-token');

    httpClient.get('/api/patients').subscribe();

    const req = httpMock.expectOne('/api/patients');
    expect(req.request.headers.has('Authorization')).toBeTrue();
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    req.flush({});
  });

  it('should not add Authorization header when no token', () => {
    spyOn(authService, 'getToken').and.returnValue(null);

    httpClient.get('/api/patients').subscribe();

    const req = httpMock.expectOne('/api/patients');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('should not add Authorization header for login endpoint', () => {
    spyOn(authService, 'getToken').and.returnValue('test-token');

    httpClient.post('/api/auth/login', {}).subscribe();

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('should not add Authorization header for refresh endpoint', () => {
    spyOn(authService, 'getToken').and.returnValue('test-token');

    httpClient.post('/api/auth/refresh', {}).subscribe();

    const req = httpMock.expectOne('/api/auth/refresh');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('should call handleLogout on 401 when refresh token is not available', () => {
    spyOn(authService, 'getToken').and.returnValue('expired-token');
    spyOn(authService, 'getRefreshToken').and.returnValue(null);
    spyOn(authService, 'handleLogout');

    httpClient.get('/api/patients').subscribe({
      error: () => {
        expect(authService.handleLogout).toHaveBeenCalled();
      }
    });

    const req = httpMock.expectOne('/api/patients');
    req.flush({}, { status: 401, statusText: 'Unauthorized' });
  });

  it('should pass through non-401 errors', () => {
    spyOn(authService, 'getToken').and.returnValue('test-token');
    spyOn(authService, 'handleLogout');

    httpClient.get('/api/patients').subscribe({
      error: (err) => {
        expect(err.status).toBe(500);
        expect(authService.handleLogout).not.toHaveBeenCalled();
      }
    });

    const req = httpMock.expectOne('/api/patients');
    req.flush({}, { status: 500, statusText: 'Server Error' });
  });
});

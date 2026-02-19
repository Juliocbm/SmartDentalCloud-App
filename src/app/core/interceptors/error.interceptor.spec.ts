import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { errorInterceptor } from './error.interceptor';
import { NotificationService } from '../services/notification.service';

describe('errorInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let notificationService: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    notificationService = TestBed.inject(NotificationService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should pass through successful requests', () => {
    httpClient.get('/api/patients').subscribe(data => {
      expect(data).toEqual({ id: '1' });
    });

    const req = httpMock.expectOne('/api/patients');
    req.flush({ id: '1' });
    expect(notificationService.notifications().length).toBe(0);
  });

  it('should show error notification on 403', () => {
    spyOn(notificationService, 'error');

    httpClient.get('/api/admin').subscribe({
      error: () => {
        expect(notificationService.error).toHaveBeenCalledWith(
          'No tiene permisos para realizar esta acción.'
        );
      }
    });

    const req = httpMock.expectOne('/api/admin');
    req.flush({}, { status: 403, statusText: 'Forbidden' });
  });

  it('should show error notification on 500', () => {
    spyOn(notificationService, 'error');

    httpClient.get('/api/data').subscribe({
      error: () => {
        expect(notificationService.error).toHaveBeenCalledWith(
          'Error interno del servidor. Intente nuevamente más tarde.'
        );
      }
    });

    const req = httpMock.expectOne('/api/data');
    req.flush({}, { status: 500, statusText: 'Internal Server Error' });
  });

  it('should show network error on status 0', () => {
    spyOn(notificationService, 'error');

    httpClient.get('/api/data').subscribe({
      error: () => {
        expect(notificationService.error).toHaveBeenCalledWith(
          'No se pudo conectar con el servidor. Verifique su conexión.'
        );
      }
    });

    const req = httpMock.expectOne('/api/data');
    req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
  });

  it('should NOT show notification on 401 (handled by authInterceptor)', () => {
    spyOn(notificationService, 'error');

    httpClient.get('/api/data').subscribe({
      error: () => {
        expect(notificationService.error).not.toHaveBeenCalled();
      }
    });

    const req = httpMock.expectOne('/api/data');
    req.flush({}, { status: 401, statusText: 'Unauthorized' });
  });

  it('should show conflict notification on 409', () => {
    spyOn(notificationService, 'warning');

    httpClient.post('/api/patients', {}).subscribe({
      error: () => {
        expect(notificationService.warning).toHaveBeenCalled();
      }
    });

    const req = httpMock.expectOne('/api/patients');
    req.flush({}, { status: 409, statusText: 'Conflict' });
  });
});

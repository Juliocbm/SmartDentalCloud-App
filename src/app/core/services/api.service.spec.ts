import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('get()', () => {
    it('should make GET request to correct URL', () => {
      service.get<{ id: string }>('/patients').subscribe(data => {
        expect(data).toEqual({ id: '1' });
      });

      const req = httpMock.expectOne('/api/patients');
      expect(req.request.method).toBe('GET');
      req.flush({ id: '1' });
    });

    it('should pass query params filtering null/undefined', () => {
      service.get('/patients', { page: 1, search: 'Juan', empty: null, undef: undefined }).subscribe();

      const req = httpMock.expectOne(r => r.url === '/api/patients');
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('search')).toBe('Juan');
      expect(req.request.params.has('empty')).toBeFalse();
      expect(req.request.params.has('undef')).toBeFalse();
      req.flush([]);
    });

    it('should pass boolean params as string', () => {
      service.get('/patients', { isActive: true }).subscribe();

      const req = httpMock.expectOne(r => r.url === '/api/patients');
      expect(req.request.params.get('isActive')).toBe('true');
      req.flush([]);
    });
  });

  describe('post()', () => {
    it('should make POST request with body', () => {
      const body = { name: 'Test' };
      service.post<{ id: string }>('/patients', body).subscribe(data => {
        expect(data).toEqual({ id: '1' });
      });

      const req = httpMock.expectOne('/api/patients');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush({ id: '1' });
    });
  });

  describe('put()', () => {
    it('should make PUT request with body', () => {
      const body = { name: 'Updated' };
      service.put<void>('/patients/1', body).subscribe();

      const req = httpMock.expectOne('/api/patients/1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(body);
      req.flush(null);
    });
  });

  describe('delete()', () => {
    it('should make DELETE request', () => {
      service.delete<void>('/patients/1').subscribe();

      const req = httpMock.expectOne('/api/patients/1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('patch()', () => {
    it('should make PATCH request with body', () => {
      service.patch<void>('/patients/1/activate', {}).subscribe();

      const req = httpMock.expectOne('/api/patients/1/activate');
      expect(req.request.method).toBe('PATCH');
      req.flush(null);
    });
  });
});

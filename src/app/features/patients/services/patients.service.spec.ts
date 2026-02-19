import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { PatientsService } from './patients.service';

describe('PatientsService', () => {
  let service: PatientsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(PatientsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call GET /patients with default pagination', () => {
    service.getAll().subscribe(data => {
      expect(data.items.length).toBe(1);
    });

    const req = httpMock.expectOne(r => r.url === '/api/patients');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('pageNumber')).toBe('1');
    expect(req.request.params.get('pageSize')).toBe('10');
    req.flush({ items: [{ id: '1', firstName: 'Juan' }], totalCount: 1 });
  });

  it('should call GET /patients with search and status filters', () => {
    service.getAll(1, 20, 'Juan', true).subscribe();

    const req = httpMock.expectOne(r => r.url === '/api/patients');
    expect(req.request.params.get('searchTerm')).toBe('Juan');
    expect(req.request.params.get('isActive')).toBe('true');
    expect(req.request.params.get('pageSize')).toBe('20');
    req.flush({ items: [], totalCount: 0 });
  });

  it('should call GET /patients/:id for getById', () => {
    service.getById('abc-123').subscribe(patient => {
      expect(patient.id).toBe('abc-123');
    });

    const req = httpMock.expectOne('/api/patients/abc-123');
    expect(req.request.method).toBe('GET');
    req.flush({ id: 'abc-123', firstName: 'Ana' });
  });

  it('should call POST /patients for create', () => {
    const newPatient = { firstName: 'Test', lastName: 'User', dateOfBirth: '2000-01-01' };
    service.create(newPatient as any).subscribe(patient => {
      expect(patient.id).toBe('new-1');
    });

    const req = httpMock.expectOne('/api/patients');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newPatient);
    req.flush({ id: 'new-1', ...newPatient });
  });

  it('should call PUT /patients/:id for update', () => {
    const updateData = { firstName: 'Updated' };
    service.update('abc-123', updateData as any).subscribe();

    const req = httpMock.expectOne('/api/patients/abc-123');
    expect(req.request.method).toBe('PUT');
    req.flush(null);
  });

  it('should call DELETE /patients/:id for delete', () => {
    service.delete('abc-123').subscribe();

    const req = httpMock.expectOne('/api/patients/abc-123');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should call PATCH /patients/:id/activate for activate', () => {
    service.activate('abc-123').subscribe();

    const req = httpMock.expectOne('/api/patients/abc-123/activate');
    expect(req.request.method).toBe('PATCH');
    req.flush(null);
  });

  it('should call PATCH /patients/:id/deactivate for deactivate', () => {
    service.deactivate('abc-123').subscribe();

    const req = httpMock.expectOne('/api/patients/abc-123/deactivate');
    expect(req.request.method).toBe('PATCH');
    req.flush(null);
  });

  it('should call searchSimple and extract items from paginated response', () => {
    service.searchSimple({ search: 'Ana', limit: 5 }).subscribe(patients => {
      expect(patients.length).toBe(1);
      expect(patients[0].id).toBe('1');
    });

    const req = httpMock.expectOne(r => r.url === '/api/patients');
    expect(req.request.params.get('searchTerm')).toBe('Ana');
    expect(req.request.params.get('pageSize')).toBe('5');
    req.flush({ items: [{ id: '1', firstName: 'Ana' }], totalCount: 1 });
  });
});

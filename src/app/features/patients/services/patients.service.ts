import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import {
  Patient,
  CreatePatientRequest,
  UpdatePatientRequest,
  UpdateMedicalHistoryRequest,
  UpdateTaxInfoRequest,
  PatientSearchFilters,
  PaginatedList
} from '../models/patient.models';
import {
  PatientDashboard,
  PatientHistory,
  PatientFinancialSummary
} from '../models/patient-dashboard.models';

@Injectable({ providedIn: 'root' })
export class PatientsService {
  private api = inject(ApiService);
  private readonly baseUrl = '/patients';

  getAll(
    pageNumber: number = 1, 
    pageSize: number = 10, 
    searchTerm?: string,
    isActive?: boolean
  ): Observable<PaginatedList<Patient>> {
    const params: any = { pageNumber, pageSize };
    if (searchTerm) {
      params.searchTerm = searchTerm;
    }
    if (isActive !== undefined) {
      params.isActive = isActive;
    }
    return this.api.get<PaginatedList<Patient>>(this.baseUrl, params);
  }

  getById(id: string): Observable<Patient> {
    return this.api.get<Patient>(`${this.baseUrl}/${id}`);
  }

  create(data: CreatePatientRequest): Observable<Patient> {
    return this.api.post<Patient>(this.baseUrl, data);
  }

  update(id: string, data: UpdatePatientRequest): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`);
  }

  search(
    filters: PatientSearchFilters,
    pageNumber: number = 1,
    pageSize: number = 10
  ): Observable<PaginatedList<Patient>> {
    const params: any = { ...filters, pageNumber, pageSize };
    return this.api.get<PaginatedList<Patient>>(`${this.baseUrl}/search`, params);
  }

  getDashboard(id: string): Observable<PatientDashboard> {
    return this.api.get<PatientDashboard>(`${this.baseUrl}/${id}/dashboard`);
  }

  getHistory(id: string): Observable<PatientHistory> {
    return this.api.get<PatientHistory>(`${this.baseUrl}/${id}/history`);
  }

  getFinancialSummary(id: string): Observable<PatientFinancialSummary> {
    return this.api.get<PatientFinancialSummary>(`${this.baseUrl}/${id}/financial-summary`);
  }

  activate(id: string): Observable<void> {
    return this.api.patch<void>(`${this.baseUrl}/${id}/activate`, {});
  }

  deactivate(id: string): Observable<void> {
    return this.api.patch<void>(`${this.baseUrl}/${id}/deactivate`, {});
  }

  updateMedicalHistory(id: string, data: UpdateMedicalHistoryRequest): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${id}/medical-history`, data);
  }

  updateTaxInfo(id: string, data: UpdateTaxInfoRequest): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${id}/tax-info`, data);
  }

  searchSimple(params: { search: string; limit?: number }): Observable<Patient[]> {
    return this.api.get<PaginatedList<Patient>>(this.baseUrl, {
      pageNumber: 1,
      pageSize: params.limit || 10,
      searchTerm: params.search
    }).pipe(
      map(response => response.items)
    );
  }
}

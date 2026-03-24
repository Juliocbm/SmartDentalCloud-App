import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService, QueryParams } from '../../../core/services/api.service';
import {
  Patient,
  CreatePatientRequest,
  UpdatePatientRequest,
  UpdateMedicalHistoryRequest,
  UpdateTaxInfoRequest,
  PatientSearchFilters,
  PaginatedList,
  ChangeHistoryEntry,
  MergePatientsRequest,
  MergeResultDto,
  ClinicalExportRequest,
  PatientClinicalExportDto
} from '../models/patient.models';
import {
  PatientDashboard,
  PatientHistory,
  PatientFinancialSummary,
  PatientLedger
} from '../models/patient-dashboard.models';

@Injectable({ providedIn: 'root' })
export class PatientsService {
  private api = inject(ApiService);
  private readonly baseUrl = '/patients';

  getAll(
    pageNumber: number = 1,
    pageSize: number = 10,
    searchTerm?: string,
    isActive?: boolean,
    orderBy?: string,
    sortDirection?: 'asc' | 'desc'
  ): Observable<PaginatedList<Patient>> {
    const params: QueryParams = { pageNumber, pageSize };
    if (searchTerm) {
      params['searchTerm'] = searchTerm;
    }
    if (isActive !== undefined) {
      params['isActive'] = isActive;
    }
    // PAC-BUG-010: pasar parámetros de ordenamiento al API
    if (orderBy) {
      params['orderBy'] = orderBy;
    }
    if (sortDirection) {
      params['sortDirection'] = sortDirection;
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
    const params: QueryParams = {
      pageNumber,
      pageSize,
      email: filters.email,
      phoneNumber: filters.phoneNumber,
      dateOfBirth: filters.dateOfBirth?.toISOString(),
      hasUpcomingAppointments: filters.hasUpcomingAppointments,
      hasPendingBalance: filters.hasPendingBalance,
      isActive: filters.isActive
    };
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

  getLedger(id: string): Observable<PatientLedger> {
    return this.api.get<PatientLedger>(`${this.baseUrl}/${id}/ledger`);
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

  getChangeHistory(id: string, page = 1, pageSize = 50, entityType?: string): Observable<ChangeHistoryEntry[]> {
    const params: QueryParams = {
      page: page.toString(),
      pageSize: pageSize.toString()
    };
    if (entityType) params['entityType'] = entityType;
    return this.api.get<ChangeHistoryEntry[]>(`${this.baseUrl}/${id}/change-history`, params);
  }

  mergePatients(data: MergePatientsRequest): Observable<MergeResultDto> {
    return this.api.post<MergeResultDto>(`${this.baseUrl}/merge`, data);
  }

  getClinicalExport(id: string, options?: ClinicalExportRequest): Observable<PatientClinicalExportDto> {
    const params: QueryParams = {};
    if (options) {
      if (options.includeAllergies !== undefined) params['includeAllergies'] = options.includeAllergies;
      if (options.includeDiagnoses !== undefined) params['includeDiagnoses'] = options.includeDiagnoses;
      if (options.includeTreatments !== undefined) params['includeTreatments'] = options.includeTreatments;
      if (options.includePrescriptions !== undefined) params['includePrescriptions'] = options.includePrescriptions;
      if (options.includeConsents !== undefined) params['includeConsents'] = options.includeConsents;
      if (options.fromDate) params['fromDate'] = options.fromDate;
      if (options.toDate) params['toDate'] = options.toDate;
    }
    return this.api.get<PatientClinicalExportDto>(`${this.baseUrl}/${id}/clinical-export`, params);
  }

  downloadClinicalExportPdf(id: string, options?: ClinicalExportRequest): Observable<Blob> {
    const parts: string[] = [];
    if (options) {
      if (options.includeAllergies !== undefined) parts.push(`includeAllergies=${options.includeAllergies}`);
      if (options.includeDiagnoses !== undefined) parts.push(`includeDiagnoses=${options.includeDiagnoses}`);
      if (options.includeTreatments !== undefined) parts.push(`includeTreatments=${options.includeTreatments}`);
      if (options.includePrescriptions !== undefined) parts.push(`includePrescriptions=${options.includePrescriptions}`);
      if (options.includeConsents !== undefined) parts.push(`includeConsents=${options.includeConsents}`);
      if (options.fromDate) parts.push(`fromDate=${options.fromDate}`);
      if (options.toDate) parts.push(`toDate=${options.toDate}`);
    }
    const qs = parts.length > 0 ? `?${parts.join('&')}` : '';
    return this.api.getBlob(`${this.baseUrl}/${id}/clinical-export/pdf${qs}`);
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

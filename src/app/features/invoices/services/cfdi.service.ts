import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService, QueryParams } from '../../../core/services/api.service';
import { PaginatedList } from '../../../core/models/pagination.models';
import { environment } from '../../../../environments/environment';
import {
  Cfdi,
  GenerateCfdiRequest,
  GenerateCfdiResult,
  TimbrarCfdiResult,
  CancelarCfdiRequest,
  CancelarCfdiResult,
  CfdiSatStatus,
  SendCfdiEmailRequest,
  CatalogosSat,
  CsdCertificate,
  CsdValidationResult,
  CsdStatus
} from '../models/cfdi.models';

@Injectable({ providedIn: 'root' })
export class CfdiService {
  private api = inject(ApiService);

  getByInvoice(invoiceId: string): Observable<Cfdi[]> {
    return this.api.get<PaginatedList<Cfdi>>('/cfdi', { invoiceId })
      .pipe(map(result => result?.items ?? []));
  }

  getById(id: string): Observable<Cfdi> {
    return this.api.get<Cfdi>(`/cfdi/${id}`);
  }

  generate(request: GenerateCfdiRequest): Observable<GenerateCfdiResult> {
    return this.api.post<GenerateCfdiResult>('/cfdi/generate', request);
  }

  timbrar(cfdiId: string): Observable<TimbrarCfdiResult> {
    return this.api.post<TimbrarCfdiResult>(`/cfdi/${cfdiId}/timbrar`, {});
  }

  cancelar(cfdiId: string, request: CancelarCfdiRequest): Observable<CancelarCfdiResult> {
    return this.api.post<CancelarCfdiResult>(`/cfdi/${cfdiId}/cancelar`, request);
  }

  deleteCfdi(cfdiId: string): Observable<void> {
    return this.api.delete<void>(`/cfdi/${cfdiId}`);
  }

  downloadXml(cfdiId: string): Observable<Blob> {
    return this.api.getBlob(`/cfdi/${cfdiId}/xml`);
  }

  downloadPdf(cfdiId: string): Observable<Blob> {
    return this.api.getBlob(`/cfdi/${cfdiId}/pdf`);
  }

  sendEmail(cfdiId: string, request: SendCfdiEmailRequest): Observable<{ message: string }> {
    return this.api.post<{ message: string }>(`/cfdi/${cfdiId}/send-email`, request);
  }

  getStatusSat(cfdiId: string): Observable<CfdiSatStatus> {
    return this.api.get<CfdiSatStatus>(`/cfdi/${cfdiId}/status-sat`);
  }

  getCatalogos(): Observable<CatalogosSat> {
    return this.api.get<CatalogosSat>('/cfdi/catalogos');
  }

  getCfdisForLookup(params?: {
    estado?: string;
    excludeCfdiId?: string;
    pageNumber?: number;
    pageSize?: number;
  }): Observable<PaginatedList<Cfdi>> {
    const queryParams: QueryParams = {};
    if (params?.estado) queryParams['estado'] = params.estado;
    if (params?.excludeCfdiId) queryParams['excludeCfdiId'] = params.excludeCfdiId;
    if (params?.pageNumber) queryParams['pageNumber'] = String(params.pageNumber);
    if (params?.pageSize) queryParams['pageSize'] = String(params.pageSize ?? 50);
    return this.api.get<PaginatedList<Cfdi>>('/cfdi/lookup', queryParams);
  }

  getAll(params?: { patientId?: string; estado?: string }): Observable<Cfdi[]> {
    const queryParams: QueryParams = {};
    if (params?.patientId) queryParams['patientId'] = params.patientId;
    if (params?.estado) queryParams['estado'] = params.estado;
    return this.api.get<Cfdi[]>('/cfdi', queryParams);
  }

  // ===== CSD (Certificado de Sello Digital) =====

  uploadCsd(cerFile: File, keyFile: File, keyPassword: string): Observable<CsdCertificate> {
    const formData = new FormData();
    formData.append('cerFile', cerFile);
    formData.append('keyFile', keyFile);
    formData.append('keyPassword', keyPassword);
    return this.api.postFormData<CsdCertificate>('/csd/upload', formData);
  }

  getActiveCsd(): Observable<CsdCertificate> {
    return this.api.get<CsdCertificate>('/csd/active');
  }

  validateCsd(cerFile: File, keyFile: File, keyPassword: string): Observable<CsdValidationResult> {
    const formData = new FormData();
    formData.append('cerFile', cerFile);
    formData.append('keyFile', keyFile);
    formData.append('keyPassword', keyPassword);
    return this.api.postFormData<CsdValidationResult>('/csd/validate', formData);
  }

  revokeCsd(id: string, reason?: string): Observable<void> {
    const params: QueryParams = {};
    if (reason) params['reason'] = reason;
    return this.api.delete<void>(`/csd/${id}`, params);
  }

  getCsdStatus(): Observable<CsdStatus> {
    return this.api.get<CsdStatus>('/csd/status');
  }
}

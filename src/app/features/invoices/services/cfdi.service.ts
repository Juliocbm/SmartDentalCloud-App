import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, QueryParams } from '../../../core/services/api.service';
import { environment } from '../../../../environments/environment';
import {
  Cfdi,
  GenerateCfdiRequest,
  GenerateCfdiResult,
  TimbrarCfdiResult,
  CancelarCfdiRequest,
  CancelarCfdiResult,
  CfdiSatStatus,
  PacConfiguration,
  SendCfdiEmailRequest
} from '../models/cfdi.models';

@Injectable({ providedIn: 'root' })
export class CfdiService {
  private api = inject(ApiService);

  getByInvoice(invoiceId: string): Observable<Cfdi[]> {
    return this.api.get<Cfdi[]>('/cfdi', { invoiceId });
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

  downloadXml(cfdiId: string): string {
    return `${environment.apiUrl}/cfdi/${cfdiId}/xml`;
  }

  downloadPdf(cfdiId: string): string {
    return `${environment.apiUrl}/cfdi/${cfdiId}/pdf`;
  }

  sendEmail(cfdiId: string, request: SendCfdiEmailRequest): Observable<{ message: string }> {
    return this.api.post<{ message: string }>(`/cfdi/${cfdiId}/send-email`, request);
  }

  getStatusSat(cfdiId: string): Observable<CfdiSatStatus> {
    return this.api.get<CfdiSatStatus>(`/cfdi/${cfdiId}/status-sat`);
  }

  testConnection(): Observable<{ pacConnected: boolean; message: string }> {
    return this.api.get<{ pacConnected: boolean; message: string }>('/cfdi/test-connection');
  }

  getConfiguration(): Observable<PacConfiguration> {
    return this.api.get<PacConfiguration>('/cfdi/configuration');
  }

  updateConfiguration(config: PacConfiguration): Observable<{ message: string }> {
    return this.api.put<{ message: string }>('/cfdi/configuration', config);
  }

  getAll(params?: { patientId?: string; estado?: string }): Observable<Cfdi[]> {
    const queryParams: QueryParams = {};
    if (params?.patientId) queryParams['patientId'] = params.patientId;
    if (params?.estado) queryParams['estado'] = params.estado;
    return this.api.get<Cfdi[]>('/cfdi', queryParams);
  }
}

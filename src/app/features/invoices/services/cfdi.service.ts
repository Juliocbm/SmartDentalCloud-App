import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/cfdi`;

  getByInvoice(invoiceId: string): Observable<Cfdi[]> {
    return this.http.get<Cfdi[]>(`${this.apiUrl}`, { params: { invoiceId } });
  }

  getById(id: string): Observable<Cfdi> {
    return this.http.get<Cfdi>(`${this.apiUrl}/${id}`);
  }

  generate(request: GenerateCfdiRequest): Observable<GenerateCfdiResult> {
    return this.http.post<GenerateCfdiResult>(`${this.apiUrl}/generate`, request);
  }

  timbrar(cfdiId: string): Observable<TimbrarCfdiResult> {
    return this.http.post<TimbrarCfdiResult>(`${this.apiUrl}/${cfdiId}/timbrar`, {});
  }

  cancelar(cfdiId: string, request: CancelarCfdiRequest): Observable<CancelarCfdiResult> {
    return this.http.post<CancelarCfdiResult>(`${this.apiUrl}/${cfdiId}/cancelar`, request);
  }

  downloadXml(cfdiId: string): string {
    return `${environment.apiUrl}/cfdi/${cfdiId}/xml`;
  }

  downloadPdf(cfdiId: string): string {
    return `${environment.apiUrl}/cfdi/${cfdiId}/pdf`;
  }

  sendEmail(cfdiId: string, request: SendCfdiEmailRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/${cfdiId}/send-email`, request);
  }

  getStatusSat(cfdiId: string): Observable<CfdiSatStatus> {
    return this.http.get<CfdiSatStatus>(`${this.apiUrl}/${cfdiId}/status-sat`);
  }

  testConnection(): Observable<{ pacConnected: boolean; message: string }> {
    return this.http.get<{ pacConnected: boolean; message: string }>(`${this.apiUrl}/test-connection`);
  }

  getConfiguration(): Observable<PacConfiguration> {
    return this.http.get<PacConfiguration>(`${this.apiUrl}/configuration`);
  }

  updateConfiguration(config: PacConfiguration): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/configuration`, config);
  }

  getAll(params?: { patientId?: string; estado?: string }): Observable<Cfdi[]> {
    return this.http.get<Cfdi[]>(this.apiUrl, { params: params as any });
  }
}

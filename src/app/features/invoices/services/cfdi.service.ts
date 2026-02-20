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
  CancelarCfdiResult
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
}

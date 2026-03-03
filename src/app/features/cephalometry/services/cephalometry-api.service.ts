import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  CephalometricAnalysis,
  CephalometricAnalysisListItem,
  CreateCephalometricAnalysisRequest,
  SaveCephalometricAnalysisRequest
} from '../models/cephalometric-analysis.models';

@Injectable({ providedIn: 'root' })
export class CephalometryApiService {
  private api = inject(ApiService);
  private readonly base = '/cephalometric-analyses';

  /**
   * Crea un nuevo análisis cefalométrico en estado Draft
   */
  create(request: CreateCephalometricAnalysisRequest): Observable<CephalometricAnalysis> {
    return this.api.post<CephalometricAnalysis>(this.base, request);
  }

  /**
   * Obtiene un análisis completo (landmarks + measurements)
   */
  getById(id: string): Observable<CephalometricAnalysis> {
    return this.api.get<CephalometricAnalysis>(`${this.base}/${id}`);
  }

  /**
   * Obtiene el historial de análisis de un paciente
   */
  getByPatient(patientId: string): Observable<CephalometricAnalysisListItem[]> {
    return this.api.get<CephalometricAnalysisListItem[]>(`${this.base}/patient/${patientId}`);
  }

  /**
   * Guarda datos de un análisis (landmarks, measurements, config, summary)
   */
  save(id: string, request: SaveCephalometricAnalysisRequest): Observable<CephalometricAnalysis> {
    return this.api.put<CephalometricAnalysis>(`${this.base}/${id}`, request);
  }

  /**
   * Firma un análisis cefalométrico (lo hace inmutable)
   */
  sign(id: string): Observable<CephalometricAnalysis> {
    return this.api.post<CephalometricAnalysis>(`${this.base}/${id}/sign`, {});
  }

  /**
   * Obtiene la imagen de radiografía como Blob (con auth headers)
   */
  getImage(id: string): Observable<Blob> {
    return this.api.getBlob(`${this.base}/${id}/image`);
  }

  /**
   * Elimina un análisis cefalométrico (soft delete)
   */
  delete(id: string): Observable<void> {
    return this.api.delete<void>(`${this.base}/${id}`);
  }
}

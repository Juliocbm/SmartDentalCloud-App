import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  Periodontogram,
  PeriodontogramListItem,
  PeriodontogramStatistics,
  PeriodontogramComparison,
  CreatePeriodontogramRequest,
  SaveMeasurementsRequest
} from '../models/periodontogram.models';

@Injectable({ providedIn: 'root' })
export class PeriodontogramService {
  private api = inject(ApiService);
  private readonly base = '/periodontograms';

  /**
   * Crea un nuevo periodontograma en estado Draft
   */
  create(request: CreatePeriodontogramRequest): Observable<Periodontogram> {
    return this.api.post<Periodontogram>(this.base, request);
  }

  /**
   * Obtiene un periodontograma completo (teeth + measurements)
   */
  getById(id: string): Observable<Periodontogram> {
    return this.api.get<Periodontogram>(`${this.base}/${id}`);
  }

  /**
   * Obtiene el historial de periodontogramas de un paciente
   */
  getByPatient(patientId: string): Observable<PeriodontogramListItem[]> {
    return this.api.get<PeriodontogramListItem[]>(`${this.base}/patient/${patientId}`);
  }

  /**
   * Guarda/actualiza mediciones (bulk transaccional)
   */
  saveMeasurements(request: SaveMeasurementsRequest): Observable<Periodontogram> {
    return this.api.put<Periodontogram>(
      `${this.base}/${request.periodontogramId}/measurements`,
      request
    );
  }

  /**
   * Firma un periodontograma (lo hace inmutable)
   */
  sign(id: string): Observable<Periodontogram> {
    return this.api.post<Periodontogram>(`${this.base}/${id}/sign`, {});
  }

  /**
   * Elimina un periodontograma (soft delete)
   */
  delete(id: string): Observable<void> {
    return this.api.delete<void>(`${this.base}/${id}`);
  }

  /**
   * Obtiene estadísticas calculadas
   */
  getStatistics(id: string): Observable<PeriodontogramStatistics> {
    return this.api.get<PeriodontogramStatistics>(`${this.base}/${id}/statistics`);
  }

  /**
   * Compara dos periodontogramas
   */
  compare(id1: string, id2: string): Observable<PeriodontogramComparison> {
    return this.api.get<PeriodontogramComparison>(`${this.base}/compare?id1=${id1}&id2=${id2}`);
  }

  /**
   * Duplica un periodontograma existente como nueva evaluación
   */
  duplicate(id: string): Observable<Periodontogram> {
    return this.api.post<Periodontogram>(`${this.base}/${id}/duplicate`, {});
  }
}

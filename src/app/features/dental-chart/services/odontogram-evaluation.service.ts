import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  OdontogramEvaluation,
  OdontogramListItem,
  OdontogramComparison,
  CreateOdontogramRequest,
  SaveOdontogramTeethRequest,
} from '../models/odontogram-evaluation.models';

@Injectable({ providedIn: 'root' })
export class OdontogramEvaluationService {
  private api = inject(ApiService);
  private readonly base = '/odontograms';

  /**
   * Crea un nuevo odontograma en estado Draft
   */
  create(request: CreateOdontogramRequest): Observable<OdontogramEvaluation> {
    return this.api.post<OdontogramEvaluation>(this.base, request);
  }

  /**
   * Obtiene un odontograma completo (teeth)
   */
  getById(id: string): Observable<OdontogramEvaluation> {
    return this.api.get<OdontogramEvaluation>(`${this.base}/${id}`);
  }

  /**
   * Obtiene el historial de odontogramas de un paciente
   */
  getByPatient(patientId: string): Observable<OdontogramListItem[]> {
    return this.api.get<OdontogramListItem[]>(
      `${this.base}/patient/${patientId}`
    );
  }

  /**
   * Guarda/actualiza teeth (bulk transaccional)
   */
  saveTeeth(
    request: SaveOdontogramTeethRequest
  ): Observable<OdontogramEvaluation> {
    return this.api.put<OdontogramEvaluation>(
      `${this.base}/${request.odontogramId}/teeth`,
      request
    );
  }

  /**
   * Firma un odontograma (lo hace inmutable)
   */
  sign(id: string): Observable<OdontogramEvaluation> {
    return this.api.post<OdontogramEvaluation>(
      `${this.base}/${id}/sign`,
      {}
    );
  }

  /**
   * Elimina un odontograma (soft delete)
   */
  delete(id: string): Observable<void> {
    return this.api.delete<void>(`${this.base}/${id}`);
  }

  /**
   * Compara dos odontogramas
   */
  compare(id1: string, id2: string): Observable<OdontogramComparison> {
    return this.api.get<OdontogramComparison>(
      `${this.base}/compare?id1=${id1}&id2=${id2}`
    );
  }

  /**
   * Duplica un odontograma existente como nueva evaluación
   */
  duplicate(id: string): Observable<OdontogramEvaluation> {
    return this.api.post<OdontogramEvaluation>(
      `${this.base}/${id}/duplicate`,
      {}
    );
  }
}

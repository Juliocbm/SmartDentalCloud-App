import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  DentalChartTooth,
  DentalChartHistoryEntry,
  UpdateToothRequest
} from '../models/dental-chart.models';

@Injectable({ providedIn: 'root' })
export class DentalChartService {
  private api = inject(ApiService);

  /**
   * Inicializa el odontograma completo de un paciente (32 piezas FDI)
   */
  initialize(patientId: string, isPrimary = false): Observable<DentalChartTooth[]> {
    return this.api.post<DentalChartTooth[]>(
      `/patients/${patientId}/dental-chart/initialize?isPrimary=${isPrimary}`,
      {}
    );
  }

  /**
   * Obtiene el odontograma completo de un paciente
   */
  getChart(patientId: string): Observable<DentalChartTooth[]> {
    return this.api.get<DentalChartTooth[]>(`/patients/${patientId}/dental-chart`);
  }

  /**
   * Actualiza el estado de una pieza dental específica
   */
  updateTooth(patientId: string, toothNumber: string, request: UpdateToothRequest): Observable<DentalChartTooth> {
    return this.api.put<DentalChartTooth>(
      `/patients/${patientId}/dental-chart/${toothNumber}`,
      request
    );
  }

  /**
   * Obtiene el historial de cambios de una pieza dental
   */
  getToothHistory(patientId: string, toothNumber: string): Observable<DentalChartHistoryEntry[]> {
    return this.api.get<DentalChartHistoryEntry[]>(
      `/patients/${patientId}/dental-chart/${toothNumber}/history`
    );
  }
}

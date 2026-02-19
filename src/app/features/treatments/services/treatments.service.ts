import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Treatment, CreateTreatmentRequest, UpdateTreatmentRequest } from '../models/treatment.models';

@Injectable()
export class TreatmentsService {
  private api = inject(ApiService);

  getAll(): Observable<Treatment[]> {
    return this.api.get<Treatment[]>('/treatments');
  }

  getById(id: string): Observable<Treatment> {
    return this.api.get<Treatment>(`/treatments/${id}`);
  }

  getByPatient(patientId: string): Observable<Treatment[]> {
    return this.api.get<Treatment[]>(`/treatments/patient/${patientId}`);
  }

  create(request: CreateTreatmentRequest): Observable<Treatment> {
    return this.api.post<Treatment>('/treatments', request);
  }

  update(id: string, request: UpdateTreatmentRequest): Observable<Treatment> {
    return this.api.put<Treatment>(`/treatments/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/treatments/${id}`);
  }
}

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Prescription, CreatePrescriptionRequest } from '../models/prescription.models';

@Injectable()
export class PrescriptionsService {
  private api = inject(ApiService);

  getAll(): Observable<Prescription[]> {
    return this.api.get<Prescription[]>('/prescriptions');
  }

  getById(id: string): Observable<Prescription> {
    return this.api.get<Prescription>(`/prescriptions/${id}`);
  }

  getByPatient(patientId: string): Observable<Prescription[]> {
    return this.api.get<Prescription[]>(`/prescriptions/patient/${patientId}`);
  }

  create(request: CreatePrescriptionRequest): Observable<Prescription> {
    return this.api.post<Prescription>('/prescriptions', request);
  }
}

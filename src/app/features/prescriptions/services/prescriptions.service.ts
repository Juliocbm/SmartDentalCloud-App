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

  sendEmail(id: string, request: { email: string }): Observable<{ message: string }> {
    return this.api.post<{ message: string }>(`/prescriptions/${id}/send-email`, request);
  }

  downloadPdf(id: string): Observable<Blob> {
    return this.api.getBlob(`/prescriptions/${id}/pdf`);
  }
}

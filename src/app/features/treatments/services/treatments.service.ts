import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Treatment, CreateTreatmentRequest, UpdateTreatmentRequest } from '../models/treatment.models';
import { TreatmentFollowUp, CreateFollowUpRequest, UpdateFollowUpRequest } from '../models/treatment-followup.models';
import { TreatmentMaterial, CreateTreatmentMaterialRequest } from '../models/treatment-material.models';
import { TreatmentSession, CreateSessionRequest } from '../models/treatment-session.models';

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

  // === Follow-ups ===

  getFollowUps(treatmentId: string): Observable<TreatmentFollowUp[]> {
    return this.api.get<TreatmentFollowUp[]>(`/treatments/${treatmentId}/followups`);
  }

  createFollowUp(treatmentId: string, request: CreateFollowUpRequest): Observable<TreatmentFollowUp> {
    return this.api.post<TreatmentFollowUp>(`/treatments/${treatmentId}/followups`, request);
  }

  updateFollowUp(treatmentId: string, id: string, request: UpdateFollowUpRequest): Observable<TreatmentFollowUp> {
    return this.api.put<TreatmentFollowUp>(`/treatments/${treatmentId}/followups/${id}`, request);
  }

  deleteFollowUp(treatmentId: string, id: string): Observable<void> {
    return this.api.delete<void>(`/treatments/${treatmentId}/followups/${id}`);
  }

  // === Materials ===

  getMaterials(treatmentId: string): Observable<TreatmentMaterial[]> {
    return this.api.get<TreatmentMaterial[]>(`/treatments/${treatmentId}/materials`);
  }

  createMaterial(treatmentId: string, request: CreateTreatmentMaterialRequest): Observable<TreatmentMaterial> {
    return this.api.post<TreatmentMaterial>(`/treatments/${treatmentId}/materials`, request);
  }

  deleteMaterial(treatmentId: string, id: string): Observable<void> {
    return this.api.delete<void>(`/treatments/${treatmentId}/materials/${id}`);
  }

  // === Sessions ===

  getSessions(treatmentId: string): Observable<TreatmentSession[]> {
    return this.api.get<TreatmentSession[]>(`/treatments/${treatmentId}/sessions`);
  }

  createSession(treatmentId: string, request: CreateSessionRequest): Observable<TreatmentSession> {
    return this.api.post<TreatmentSession>(`/treatments/${treatmentId}/sessions`, request);
  }
}

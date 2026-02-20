import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  TreatmentPlan,
  CreateTreatmentPlanRequest,
  RejectPlanRequest,
  TreatmentPlanProgress
} from '../models/treatment-plan.models';

@Injectable()
export class TreatmentPlansService {
  private api = inject(ApiService);

  getAll(): Observable<TreatmentPlan[]> {
    return this.api.get<TreatmentPlan[]>('/treatmentplans');
  }

  getById(id: string): Observable<TreatmentPlan> {
    return this.api.get<TreatmentPlan>(`/treatmentplans/${id}`);
  }

  getByPatient(patientId: string): Observable<TreatmentPlan[]> {
    return this.api.get<TreatmentPlan[]>(`/treatmentplans/patient/${patientId}`);
  }

  getProgress(id: string): Observable<TreatmentPlanProgress> {
    return this.api.get<TreatmentPlanProgress>(`/treatmentplans/${id}/progress`);
  }

  create(request: CreateTreatmentPlanRequest): Observable<TreatmentPlan> {
    return this.api.post<TreatmentPlan>('/treatmentplans', request);
  }

  approve(id: string): Observable<TreatmentPlan> {
    return this.api.post<TreatmentPlan>(`/treatmentplans/${id}/approve`, {});
  }

  reject(id: string, reason: string): Observable<TreatmentPlan> {
    const request: RejectPlanRequest = { planId: id, reason };
    return this.api.post<TreatmentPlan>(`/treatmentplans/${id}/reject`, request);
  }

  start(id: string): Observable<TreatmentPlan> {
    return this.api.post<TreatmentPlan>(`/treatmentplans/${id}/start`, {});
  }
}

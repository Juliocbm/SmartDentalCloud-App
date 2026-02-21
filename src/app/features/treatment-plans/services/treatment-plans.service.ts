import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  TreatmentPlan,
  TreatmentPlanItem,
  CreateTreatmentPlanRequest,
  RejectPlanRequest,
  UpdateItemProgressRequest,
  TreatmentPlanProgress
} from '../models/treatment-plan.models';

@Injectable()
export class TreatmentPlansService {
  private api = inject(ApiService);

  getAll(): Observable<TreatmentPlan[]> {
    return this.api.get<TreatmentPlan[]>('/treatment-plans');
  }

  getById(id: string): Observable<TreatmentPlan> {
    return this.api.get<TreatmentPlan>(`/treatment-plans/${id}`);
  }

  getByPatient(patientId: string): Observable<TreatmentPlan[]> {
    return this.api.get<TreatmentPlan[]>(`/treatment-plans/patient/${patientId}`);
  }

  getProgress(id: string): Observable<TreatmentPlanProgress> {
    return this.api.get<TreatmentPlanProgress>(`/treatment-plans/${id}/progress`);
  }

  create(request: CreateTreatmentPlanRequest): Observable<TreatmentPlan> {
    return this.api.post<TreatmentPlan>('/treatment-plans', request);
  }

  approve(id: string): Observable<TreatmentPlan> {
    return this.api.post<TreatmentPlan>(`/treatment-plans/${id}/approve`, {});
  }

  reject(id: string, reason: string): Observable<TreatmentPlan> {
    const request: RejectPlanRequest = { planId: id, reason };
    return this.api.post<TreatmentPlan>(`/treatment-plans/${id}/reject`, request);
  }

  start(id: string): Observable<TreatmentPlan> {
    return this.api.post<TreatmentPlan>(`/treatment-plans/${id}/start`, {});
  }

  updateItemProgress(planId: string, itemId: string, request: UpdateItemProgressRequest): Observable<TreatmentPlanItem> {
    return this.api.put<TreatmentPlanItem>(`/treatment-plans/${planId}/items/${itemId}/progress`, request);
  }
}

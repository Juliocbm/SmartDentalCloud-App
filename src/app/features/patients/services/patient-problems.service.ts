import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  PatientProblem,
  CreatePatientProblemRequest,
  ResolvePatientProblemRequest
} from '../models/patient-problem.models';

@Injectable({ providedIn: 'root' })
export class PatientProblemsService {
  private api = inject(ApiService);

  getByPatient(patientId: string, status?: string): Observable<PatientProblem[]> {
    const params: any = {};
    if (status) params.status = status;
    return this.api.get<PatientProblem[]>(`/patients/${patientId}/problems`, params);
  }

  create(patientId: string, data: CreatePatientProblemRequest): Observable<PatientProblem> {
    return this.api.post<PatientProblem>(`/patients/${patientId}/problems`, data);
  }

  resolve(patientId: string, id: string, data: ResolvePatientProblemRequest): Observable<void> {
    return this.api.patch<void>(`/patients/${patientId}/problems/${id}/resolve`, data);
  }
}

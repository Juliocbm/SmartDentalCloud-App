import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { PaginatedList } from '../../../core/models/pagination.models';
import {
  PatientDiagnosis,
  CreatePatientDiagnosisRequest,
  ResolvePatientDiagnosisRequest
} from '../models/patient-diagnosis.models';

@Injectable({ providedIn: 'root' })
export class PatientDiagnosesService {
  private api = inject(ApiService);

  getByPatient(patientId: string, pageNumber: number = 1, pageSize: number = 10, status?: string): Observable<PaginatedList<PatientDiagnosis>> {
    const params: any = { pageNumber, pageSize };
    if (status) params.status = status;
    return this.api.get<PaginatedList<PatientDiagnosis>>(`/patients/${patientId}/diagnoses`, params);
  }

  create(patientId: string, data: CreatePatientDiagnosisRequest): Observable<PatientDiagnosis> {
    return this.api.post<PatientDiagnosis>(`/patients/${patientId}/diagnoses`, data);
  }

  resolve(patientId: string, id: string, data: ResolvePatientDiagnosisRequest): Observable<void> {
    return this.api.patch<void>(`/patients/${patientId}/diagnoses/${id}/resolve`, data);
  }
}

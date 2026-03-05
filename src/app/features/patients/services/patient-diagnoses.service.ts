import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  PatientDiagnosis,
  CreatePatientDiagnosisRequest,
  ResolvePatientDiagnosisRequest
} from '../models/patient-diagnosis.models';

@Injectable({ providedIn: 'root' })
export class PatientDiagnosesService {
  private api = inject(ApiService);

  getByPatient(patientId: string, status?: string): Observable<PatientDiagnosis[]> {
    const params: any = {};
    if (status) params.status = status;
    return this.api.get<PatientDiagnosis[]>(`/patients/${patientId}/diagnoses`, params);
  }

  create(patientId: string, data: CreatePatientDiagnosisRequest): Observable<PatientDiagnosis> {
    return this.api.post<PatientDiagnosis>(`/patients/${patientId}/diagnoses`, data);
  }

  resolve(patientId: string, id: string, data: ResolvePatientDiagnosisRequest): Observable<void> {
    return this.api.patch<void>(`/patients/${patientId}/diagnoses/${id}/resolve`, data);
  }
}

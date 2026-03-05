import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiService } from '../../../core/services/api.service';
import { RadiologicImageDto } from '../models/radiologic-image.models';

@Injectable({ providedIn: 'root' })
export class RadiologicImagesService {
  private http = inject(HttpClient);
  private api = inject(ApiService);
  private apiUrl = environment.apiUrl;

  getByPatient(patientId: string, imageType?: string): Observable<RadiologicImageDto[]> {
    let params = new HttpParams();
    if (imageType) params = params.set('imageType', imageType);
    return this.http.get<RadiologicImageDto[]>(
      `${this.apiUrl}/patients/${patientId}/radiologic-images`, { params }
    );
  }

  getById(patientId: string, imageId: string): Observable<RadiologicImageDto> {
    return this.http.get<RadiologicImageDto>(
      `${this.apiUrl}/patients/${patientId}/radiologic-images/${imageId}`
    );
  }

  upload(
    patientId: string,
    file: File,
    imageType: string,
    title: string,
    description?: string,
    takenAt?: string,
    takenBy?: string,
    notes?: string,
    appointmentId?: string
  ): Observable<RadiologicImageDto> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('imageType', imageType);
    formData.append('title', title);
    if (description) formData.append('description', description);
    if (takenAt) formData.append('takenAt', takenAt);
    if (takenBy) formData.append('takenBy', takenBy);
    if (notes) formData.append('notes', notes);
    if (appointmentId) formData.append('appointmentId', appointmentId);
    return this.http.post<RadiologicImageDto>(
      `${this.apiUrl}/patients/${patientId}/radiologic-images`, formData
    );
  }

  getFileBlob(patientId: string, imageId: string): Observable<Blob> {
    return this.api.getBlob(`/patients/${patientId}/radiologic-images/${imageId}/file`);
  }

  delete(patientId: string, imageId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/patients/${patientId}/radiologic-images/${imageId}`
    );
  }
}

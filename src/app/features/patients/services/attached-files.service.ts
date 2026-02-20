import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AttachedFile } from '../models/attached-file.models';

@Injectable({ providedIn: 'root' })
export class AttachedFilesService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getByPatient(patientId: string, category?: string): Observable<AttachedFile[]> {
    let params = new HttpParams();
    if (category) {
      params = params.set('category', category);
    }
    return this.http.get<AttachedFile[]>(`${this.apiUrl}/patients/${patientId}/files`, { params });
  }

  getById(fileId: string): Observable<AttachedFile> {
    return this.http.get<AttachedFile>(`${this.apiUrl}/files/${fileId}`);
  }

  upload(
    patientId: string,
    file: File,
    category?: string,
    description?: string,
    tags?: string
  ): Observable<AttachedFile> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    if (category) formData.append('category', category);
    if (description) formData.append('description', description);
    if (tags) formData.append('tags', tags);

    return this.http.post<AttachedFile>(
      `${this.apiUrl}/patients/${patientId}/files`,
      formData
    );
  }

  delete(fileId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/files/${fileId}`);
  }
}

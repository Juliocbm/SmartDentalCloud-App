import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Cie10Code {
  code: string;
  description: string;
  category: string | null;
  isOdontological: boolean;
}

@Injectable({ providedIn: 'root' })
export class Cie10Service {
  private api = inject(ApiService);

  search(term: string, odontologicalOnly?: boolean): Observable<Cie10Code[]> {
    const params: Record<string, string> = { search: term };
    if (odontologicalOnly) params['odontologicalOnly'] = 'true';
    return this.api.get<Cie10Code[]>('/cie10', params);
  }
}

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface StateDto {
  id: number;
  code: string;
  name: string;
}

export interface MunicipalityDto {
  id: number;
  code: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class CatalogsService {
  private api = inject(ApiService);
  private readonly baseUrl = '/catalogs';

  getStates(): Observable<StateDto[]> {
    return this.api.get<StateDto[]>(`${this.baseUrl}/states`);
  }

  getMunicipalitiesByState(stateId: number): Observable<MunicipalityDto[]> {
    return this.api.get<MunicipalityDto[]>(`${this.baseUrl}/states/${stateId}/municipalities`);
  }
}

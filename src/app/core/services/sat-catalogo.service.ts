import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface SatClaveProdServ {
  clave: string;
  descripcion: string;
  segmento: string | null;
  grupo: string | null;
  isDental: boolean;
}

export interface SatClaveUnidad {
  clave: string;
  nombre: string;
  descripcion: string | null;
  simbolo: string | null;
}

@Injectable({ providedIn: 'root' })
export class SatCatalogoService {
  private api = inject(ApiService);

  searchClaveProdServ(term: string, dentalOnly?: boolean): Observable<SatClaveProdServ[]> {
    const params: Record<string, string> = { search: term };
    if (dentalOnly) params['dentalOnly'] = 'true';
    return this.api.get<SatClaveProdServ[]>('/sat-catalogos/clave-prod-serv', params);
  }

  searchClaveUnidad(term: string): Observable<SatClaveUnidad[]> {
    return this.api.get<SatClaveUnidad[]>('/sat-catalogos/clave-unidad', { search: term });
  }
}

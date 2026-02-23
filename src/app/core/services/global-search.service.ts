import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { GlobalSearchResult } from '../models/search.models';

@Injectable({ providedIn: 'root' })
export class GlobalSearchService {
  private api = inject(ApiService);

  search(term: string, limit: number = 3): Observable<GlobalSearchResult> {
    return this.api.get<GlobalSearchResult>('/search', { term, limit });
  }
}

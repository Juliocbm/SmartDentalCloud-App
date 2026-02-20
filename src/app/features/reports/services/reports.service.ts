import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, QueryParams } from '../../../core/services/api.service';
import { AccountsReceivableItem } from '../models/report.models';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private api = inject(ApiService);

  getAccountsReceivable(patientId?: string, minDaysOverdue?: number): Observable<AccountsReceivableItem[]> {
    const params: QueryParams = {};
    if (patientId) params['patientId'] = patientId;
    if (minDaysOverdue != null) params['minDaysOverdue'] = minDaysOverdue;
    return this.api.get<AccountsReceivableItem[]>('/reports/accounts-receivable', params);
  }
}

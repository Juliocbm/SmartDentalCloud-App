import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Payment, CreatePaymentRequest } from '../models/invoice.models';

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private api = inject(ApiService);

  getByInvoice(invoiceId: string): Observable<Payment[]> {
    return this.api.get<Payment[]>('/payments', { invoiceId });
  }

  create(request: CreatePaymentRequest): Observable<Payment> {
    return this.api.post<Payment>('/payments', request);
  }
}

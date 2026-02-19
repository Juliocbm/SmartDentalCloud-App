import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Payment, CreatePaymentRequest, PaymentFilters } from '../models/payment.models';

/**
 * Servicio para gestión de pagos
 * Lazy-loaded, NO usar providedIn: 'root'
 */
@Injectable()
export class PaymentsService {
  private api = inject(ApiService);
  private readonly baseUrl = '/payments';

  /**
   * Obtiene lista de todos los pagos
   */
  getAll(): Observable<Payment[]> {
    return this.api.get<Payment[]>(this.baseUrl);
  }

  /**
   * Obtiene un pago por ID
   */
  getById(id: string): Observable<Payment> {
    return this.api.get<Payment>(`${this.baseUrl}/${id}`);
  }

  /**
   * Crea un nuevo pago
   */
  create(request: CreatePaymentRequest): Observable<Payment> {
    return this.api.post<Payment>(this.baseUrl, request);
  }

  /**
   * Filtra pagos según criterios
   * Implementación cliente-side
   */
  filter(payments: Payment[], filters: PaymentFilters): Payment[] {
    let filtered = [...payments];

    if (filters.patientId) {
      filtered = filtered.filter(p => p.patientId === filters.patientId);
    }

    if (filters.invoiceId) {
      filtered = filtered.filter(p => p.invoiceId === filters.invoiceId);
    }

    if (filters.paymentMethod) {
      filtered = filtered.filter(p => p.paymentMethod === filters.paymentMethod);
    }

    if (filters.startDate) {
      filtered = filtered.filter(p => new Date(p.paidAt) >= filters.startDate!);
    }

    if (filters.endDate) {
      filtered = filtered.filter(p => new Date(p.paidAt) <= filters.endDate!);
    }

    return filtered;
  }

  /**
   * Calcula total de pagos
   */
  calculateTotal(payments: Payment[]): number {
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  }
}

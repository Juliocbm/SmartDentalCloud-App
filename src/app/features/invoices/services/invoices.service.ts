import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  Invoice,
  CreateInvoiceRequest,
  AccountsReceivable,
  InvoiceFilters
} from '../models/invoice.models';

/**
 * Servicio para gestión de facturas
 * Lazy-loaded, NO usar providedIn: 'root'
 */
@Injectable()
export class InvoicesService {
  private api = inject(ApiService);
  private readonly baseUrl = '/invoices';

  /**
   * Obtiene lista de todas las facturas
   */
  getAll(): Observable<Invoice[]> {
    return this.api.get<Invoice[]>(this.baseUrl);
  }

  /**
   * Obtiene una factura por ID
   */
  getById(id: string): Observable<Invoice> {
    return this.api.get<Invoice>(`${this.baseUrl}/${id}`);
  }

  /**
   * Obtiene facturas de un paciente específico
   */
  getByPatient(patientId: string): Observable<Invoice[]> {
    return this.api.get<Invoice[]>(`${this.baseUrl}/patient/${patientId}`);
  }

  /**
   * Obtiene historial de pagos de una factura
   */
  getInvoicePayments(invoiceId: string): Observable<any[]> {
    return this.api.get<any[]>(`${this.baseUrl}/${invoiceId}/payments`);
  }

  /**
   * Obtiene resumen de cuentas por cobrar
   */
  getAccountsReceivable(): Observable<AccountsReceivable> {
    return this.api.get<AccountsReceivable>(`${this.baseUrl}/accounts-receivable`);
  }

  /**
   * Crea una nueva factura con items
   */
  create(request: CreateInvoiceRequest): Observable<Invoice> {
    return this.api.post<Invoice>(this.baseUrl, request);
  }

  /**
   * Filtra facturas según criterios
   * Implementación cliente-side hasta que backend tenga endpoint de filtrado
   */
  filter(invoices: Invoice[], filters: InvoiceFilters): Invoice[] {
    let filtered = [...invoices];

    if (filters.patientId) {
      filtered = filtered.filter(inv => inv.patientId === filters.patientId);
    }

    if (filters.status) {
      filtered = filtered.filter(inv => inv.status === filters.status);
    }

    if (filters.startDate) {
      filtered = filtered.filter(inv => new Date(inv.issuedAt) >= filters.startDate!);
    }

    if (filters.endDate) {
      filtered = filtered.filter(inv => new Date(inv.issuedAt) <= filters.endDate!);
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(inv =>
        inv.patientName.toLowerCase().includes(term) ||
        inv.folio?.toLowerCase().includes(term) ||
        inv.serie?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }

  /**
   * Calcula totales de una lista de facturas
   */
  calculateTotals(invoices: Invoice[]) {
    return {
      total: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
      paid: invoices.reduce((sum, inv) => sum + inv.paidAmount, 0),
      balance: invoices.reduce((sum, inv) => sum + inv.balance, 0),
      count: invoices.length
    };
  }
}

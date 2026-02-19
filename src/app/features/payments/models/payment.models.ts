// ============================================================================
// Payment Models - SmartDentalCloud
// ============================================================================

/**
 * Pago recibido (registro de cobro)
 */
export interface Payment {
  id: string;
  patientId: string;
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  paidAt: Date;
  reference: string | null;
  createdAt: Date;
}

/**
 * Request para crear pago
 */
export interface CreatePaymentRequest {
  patientId: string;
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  paidAt: Date;
  reference?: string;
}

/**
 * Métodos de pago disponibles
 */
export enum PaymentMethod {
  Cash = 'cash',
  Card = 'card',
  Transfer = 'transfer',
  Check = 'check',
  Other = 'other'
}

/**
 * Configuración de métodos de pago
 */
export const PAYMENT_METHOD_CONFIG = {
  [PaymentMethod.Cash]: {
    label: 'Efectivo',
    icon: 'fa-money-bill-wave',
    color: 'var(--success-500)'
  },
  [PaymentMethod.Card]: {
    label: 'Tarjeta',
    icon: 'fa-credit-card',
    color: 'var(--primary-500)'
  },
  [PaymentMethod.Transfer]: {
    label: 'Transferencia',
    icon: 'fa-building-columns',
    color: 'var(--info-500)'
  },
  [PaymentMethod.Check]: {
    label: 'Cheque',
    icon: 'fa-money-check',
    color: 'var(--warning-500)'
  },
  [PaymentMethod.Other]: {
    label: 'Otro',
    icon: 'fa-ellipsis',
    color: 'var(--neutral-500)'
  }
};

/**
 * Filtros para lista de pagos
 */
export interface PaymentFilters {
  patientId?: string;
  invoiceId?: string;
  paymentMethod?: PaymentMethod;
  startDate?: Date;
  endDate?: Date;
}

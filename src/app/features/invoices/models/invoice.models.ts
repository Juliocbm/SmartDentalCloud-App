// ============================================================================
// Invoice Models - SmartDentalCloud
// ============================================================================

/**
 * Estado de factura
 */
export enum InvoiceStatus {
  Pending = 'Pending',
  PartiallyPaid = 'PartiallyPaid',
  Paid = 'Paid',
  Cancelled = 'Cancelled',
  Overdue = 'Overdue'
}

/**
 * Configuración visual de estados de factura
 */
export const INVOICE_STATUS_CONFIG = {
  [InvoiceStatus.Pending]: {
    label: 'Pendiente',
    class: 'badge-warning',
    icon: 'fa-clock'
  },
  [InvoiceStatus.PartiallyPaid]: {
    label: 'Parcialmente Pagada',
    class: 'badge-info',
    icon: 'fa-coins'
  },
  [InvoiceStatus.Paid]: {
    label: 'Pagada',
    class: 'badge-success',
    icon: 'fa-check-circle'
  },
  [InvoiceStatus.Cancelled]: {
    label: 'Cancelada',
    class: 'badge-error',
    icon: 'fa-ban'
  },
  [InvoiceStatus.Overdue]: {
    label: 'Vencida',
    class: 'badge-error',
    icon: 'fa-exclamation-triangle'
  }
};

/**
 * Factura (DTO de respuesta del backend)
 */
export interface Invoice {
  id: string;
  patientId: string;
  patientName: string;
  uuid: string | null;
  issuedAt: Date;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  lastPaymentDate: Date | null;
  status: InvoiceStatus;
  createdAt: Date;
  
  // Campos CFDI (México)
  serie: string | null;
  folio: string | null;
  cfdiUUID: string | null;
  stampedAt: Date | null;
  rfcEmisor: string | null;
  rfcReceptor: string | null;
  usoCFDI: string | null;
  metodoPago: string | null;
  formaPago: string | null;
  
  // Items
  items: InvoiceItem[];
}

/**
 * Línea de factura (item)
 */
export interface InvoiceItem {
  id: string;
  treatmentId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discountPercentage: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  
  // Campos CFDI opcionales
  claveProdServ: string | null;
  claveUnidad: string | null;
  noIdentificacion: string | null;
  
  displayOrder: number;
}

/**
 * Request para crear factura
 */
export interface CreateInvoiceRequest {
  patientId: string;
  usoCFDI?: string;
  metodoPago?: string;
  formaPago?: string;
  items: CreateInvoiceItemRequest[];
}

/**
 * Request para crear item de factura
 */
export interface CreateInvoiceItemRequest {
  treatmentId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercentage?: number;
  taxRate?: number;
  claveProdServ?: string;
  claveUnidad?: string;
  noIdentificacion?: string;
}

/**
 * Cuentas por cobrar (resumen)
 */
export interface AccountsReceivable {
  totalInvoiced: number;
  totalPaid: number;
  totalPending: number;
  overdueAmount: number;
  invoicesCount: number;
  paidInvoicesCount: number;
  pendingInvoicesCount: number;
  overdueInvoicesCount: number;
}

/**
 * Catálogos SAT para CFDI (México)
 */
export const CFDI_USO_OPTIONS = [
  { value: 'G03', label: 'G03 - Gastos en general' },
  { value: 'G01', label: 'G01 - Adquisición de mercancías' },
  { value: 'G02', label: 'G02 - Devoluciones, descuentos o bonificaciones' },
  { value: 'I01', label: 'I01 - Construcciones' },
  { value: 'I02', label: 'I02 - Mobilario y equipo de oficina' },
  { value: 'I03', label: 'I03 - Equipo de transporte' },
  { value: 'D01', label: 'D01 - Honorarios médicos' },
  { value: 'D02', label: 'D02 - Gastos médicos por incapacidad' }
];

export const CFDI_METODO_PAGO_OPTIONS = [
  { value: 'PUE', label: 'PUE - Pago en una sola exhibición' },
  { value: 'PPD', label: 'PPD - Pago en parcialidades o diferido' }
];

export const CFDI_FORMA_PAGO_OPTIONS = [
  { value: '01', label: '01 - Efectivo' },
  { value: '02', label: '02 - Cheque nominativo' },
  { value: '03', label: '03 - Transferencia electrónica de fondos' },
  { value: '04', label: '04 - Tarjeta de crédito' },
  { value: '28', label: '28 - Tarjeta de débito' },
  { value: '99', label: '99 - Por definir' }
];

/**
 * Pago registrado (DTO de respuesta del backend)
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
 * Request para registrar un pago
 */
export interface CreatePaymentRequest {
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  paidAt: string;
  reference?: string;
}

/**
 * Métodos de pago disponibles
 */
export const PAYMENT_METHOD_OPTIONS = [
  { value: 'cash', label: 'Efectivo', icon: 'fa-money-bill' },
  { value: 'card', label: 'Tarjeta', icon: 'fa-credit-card' },
  { value: 'transfer', label: 'Transferencia', icon: 'fa-building-columns' },
  { value: 'check', label: 'Cheque', icon: 'fa-money-check' }
];

/**
 * Filtros para lista de facturas
 */
export interface InvoiceFilters {
  patientId?: string;
  status?: InvoiceStatus;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;
}

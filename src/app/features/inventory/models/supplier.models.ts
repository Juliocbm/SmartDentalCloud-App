/**
 * Modelos para gestión de proveedores de inventario
 */

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  paymentTerms?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface CreateSupplierRequest {
  code: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  paymentTerms?: string;
  notes?: string;
}

export interface UpdateSupplierRequest {
  code: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  paymentTerms?: string;
  notes?: string;
  isActive: boolean;
}

/**
 * Términos de pago comunes
 */
export const PAYMENT_TERMS = [
  { value: 'immediate', label: 'Inmediato' },
  { value: 'net15', label: 'Neto 15 días' },
  { value: 'net30', label: 'Neto 30 días' },
  { value: 'net60', label: 'Neto 60 días' },
  { value: 'net90', label: 'Neto 90 días' },
  { value: 'advance', label: 'Anticipo' },
  { value: 'cod', label: 'Contra entrega' }
] as const;

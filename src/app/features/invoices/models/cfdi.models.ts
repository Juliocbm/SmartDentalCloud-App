/**
 * Interfaces para CFDI (Comprobantes Fiscales Digitales)
 * Mirrors backend: CfdiDto, GenerateCfdiResult, CancelarCfdiResult
 * API: /api/cfdi
 */

export interface Cfdi {
  id: string;
  invoiceId: string;
  patientId: string;
  serie?: string;
  folio?: string;
  fecha: Date;
  formaPago?: string;
  metodoPago: string;
  subTotal: number;
  descuento?: number;
  total: number;
  emisorRfc: string;
  emisorNombre: string;
  receptorRfc: string;
  receptorNombre: string;
  receptorUsoCfdi: string;
  uuid?: string;
  fechaTimbrado?: Date;
  estado: string;
  xmlSinTimbrar?: string;
  xmlTimbrado?: string;
  xmlPath?: string;
  pdfPath?: string;
  createdAt: Date;
}

export interface GenerateCfdiRequest {
  invoiceId: string;
  usoCfdi?: string;
  metodoPago?: string;
  formaPago?: string;
}

export interface GenerateCfdiResult {
  cfdiId: string;
  folio: string;
  xmlSinTimbrar: string;
  esValido: boolean;
  erroresValidacion: string[];
  estado: string;
}

export interface TimbrarCfdiResult {
  exitoso: boolean;
  uuid?: string;
  fechaTimbrado?: Date;
  mensajeError?: string;
}

export interface CancelarCfdiRequest {
  motivoCancelacion: string;
  uuidSustitucion?: string;
  observaciones?: string;
}

export interface CancelarCfdiResult {
  exitoso: boolean;
  uuid?: string;
  fechaCancelacion?: Date;
  estatusCancelacion?: string;
  mensajeError?: string;
  requiereAceptacion: boolean;
}

export interface CfdiStatusConfig {
  label: string;
  class: string;
  icon: string;
}

export const CFDI_STATUS_CONFIG: Record<string, CfdiStatusConfig> = {
  PendienteTimbrado: { label: 'Pendiente Timbrado', class: 'badge-warning', icon: 'fa-clock' },
  Timbrado: { label: 'Timbrado', class: 'badge-success', icon: 'fa-check-circle' },
  Cancelado: { label: 'Cancelado', class: 'badge-error', icon: 'fa-ban' },
  ErrorTimbrado: { label: 'Error Timbrado', class: 'badge-error', icon: 'fa-exclamation-triangle' },
  ErrorValidacion: { label: 'Error Validación', class: 'badge-error', icon: 'fa-exclamation-triangle' }
};

export interface CfdiSatStatus {
  uuid: string;
  estadoSat: string;
  esCancelable: string;
  estatusCancelacion: string;
}

export interface PacConfiguration {
  pacProvider: string;
  pacUsername?: string;
  pacPassword?: string;
  pacApiUrl?: string;
  environment: string;
  configured?: boolean;
}

export interface SendCfdiEmailRequest {
  email: string;
  includeXml?: boolean;
  includePdf?: boolean;
}

export const MOTIVO_CANCELACION_OPTIONS = [
  { value: '01', label: '01 - Comprobante emitido con errores con relación' },
  { value: '02', label: '02 - Comprobante emitido con errores sin relación' },
  { value: '03', label: '03 - No se llevó a cabo la operación' },
  { value: '04', label: '04 - Operación nominativa relacionada en factura global' }
];

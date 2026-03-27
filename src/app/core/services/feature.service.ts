import { Injectable, inject, computed } from '@angular/core';
import { EntitlementService } from './entitlement.service';

export type PlanFeature =
  | 'Patients' | 'Appointments' | 'ClinicalRecords' | 'Odontogram'
  | 'BasicInvoicing' | 'Prescriptions' | 'ConsultationNotes' | 'InformedConsents'
  | 'Periodontogram' | 'Cephalometry' | 'TreatmentPlans'
  | 'Inventory' | 'PurchaseOrders' | 'AdvancedReports' | 'CfdiTimbrado'
  | 'WhatsAppMessaging' | 'DataExport'
  | 'MultiLocation' | 'CustomDomain' | 'ApiAccess' | 'AuditLog'
  | 'DigitalSignatures' | 'CustomBranding';

const FEATURE_LABELS: Record<PlanFeature, string> = {
  'Patients': 'Gestión de Pacientes',
  'Appointments': 'Citas y Calendario',
  'ClinicalRecords': 'Expediente Clínico',
  'Odontogram': 'Odontograma Digital',
  'BasicInvoicing': 'Facturación Básica',
  'Prescriptions': 'Recetas Médicas',
  'ConsultationNotes': 'Notas de Consulta',
  'InformedConsents': 'Consentimientos Informados',
  'Periodontogram': 'Periodontograma',
  'Cephalometry': 'Cefalometría',
  'TreatmentPlans': 'Planes de Tratamiento',
  'Inventory': 'Inventario y Proveedores',
  'PurchaseOrders': 'Órdenes de Compra',
  'AdvancedReports': 'Reportes Avanzados',
  'CfdiTimbrado': 'Timbrado CFDI',
  'WhatsAppMessaging': 'Mensajería WhatsApp',
  'DataExport': 'Exportación de Datos',
  'MultiLocation': 'Multi-sucursal',
  'CustomDomain': 'Dominio Personalizado',
  'ApiAccess': 'API Access',
  'AuditLog': 'Auditoría',
  'DigitalSignatures': 'Firmas Digitales',
  'CustomBranding': 'Marca Personalizada'
};

/**
 * Wrapper sobre EntitlementService para backward compatibility.
 * Los guards, sidebar y componentes existentes siguen usando FeatureService.
 * Internamente delega a EntitlementService que carga features desde el backend.
 */
@Injectable({ providedIn: 'root' })
export class FeatureService {
  private entitlementService = inject(EntitlementService);

  readonly planName = this.entitlementService.planName;
  readonly features = computed(() => this.entitlementService.enabledFeatures() as PlanFeature[]);
  readonly loaded = this.entitlementService.loaded;

  hasFeature(feature: PlanFeature): boolean {
    return this.entitlementService.hasFeature(feature);
  }

  getFeatureLabel(feature: PlanFeature): string {
    return FEATURE_LABELS[feature] ?? feature;
  }

  getMinimumPlan(feature: PlanFeature): string {
    return this.entitlementService.getMinimumPlanForFeature(feature);
  }

  reset(): void {
    this.entitlementService.reset();
  }
}

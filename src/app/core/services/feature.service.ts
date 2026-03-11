import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';

export type PlanFeature =
  | 'Patients' | 'Appointments' | 'ClinicalRecords' | 'Odontogram'
  | 'BasicInvoicing' | 'Prescriptions' | 'ConsultationNotes'
  | 'Periodontogram' | 'Cephalometry' | 'TreatmentPlans'
  | 'Inventory' | 'PurchaseOrders' | 'AdvancedReports' | 'CfdiTimbrado'
  | 'MultiLocation' | 'CustomDomain' | 'ApiAccess' | 'AuditLog';

export interface FeatureAccessInfo {
  planName: string;
  features: PlanFeature[];
}

const CORE_FEATURES: PlanFeature[] = [
  'Patients', 'Appointments', 'ClinicalRecords', 'Odontogram',
  'BasicInvoicing', 'Prescriptions', 'ConsultationNotes'
];

const ADVANCED_FEATURES: PlanFeature[] = [
  'Periodontogram', 'Cephalometry', 'TreatmentPlans',
  'Inventory', 'PurchaseOrders', 'AdvancedReports', 'CfdiTimbrado',
  'MultiLocation'
];

const ENTERPRISE_FEATURES: PlanFeature[] = [
  'CustomDomain', 'ApiAccess', 'AuditLog'
];

const PLAN_FEATURES_MAP: Record<string, PlanFeature[]> = {
  'Básico': [...CORE_FEATURES],
  'Profesional': [...CORE_FEATURES, ...ADVANCED_FEATURES],
  'Empresarial': [...CORE_FEATURES, ...ADVANCED_FEATURES, ...ENTERPRISE_FEATURES]
};

const FEATURE_LABELS: Record<PlanFeature, string> = {
  'Patients': 'Gestión de Pacientes',
  'Appointments': 'Citas y Calendario',
  'ClinicalRecords': 'Expediente Clínico',
  'Odontogram': 'Odontograma Digital',
  'BasicInvoicing': 'Facturación Básica',
  'Prescriptions': 'Recetas Médicas',
  'ConsultationNotes': 'Notas de Consulta',
  'Periodontogram': 'Periodontograma',
  'Cephalometry': 'Cefalometría',
  'TreatmentPlans': 'Planes de Tratamiento',
  'Inventory': 'Inventario y Proveedores',
  'PurchaseOrders': 'Órdenes de Compra',
  'AdvancedReports': 'Reportes Avanzados',
  'CfdiTimbrado': 'Timbrado CFDI',
  'MultiLocation': 'Multi-sucursal',
  'CustomDomain': 'Dominio Personalizado',
  'ApiAccess': 'API Access',
  'AuditLog': 'Auditoría'
};

@Injectable({ providedIn: 'root' })
export class FeatureService {
  private api = inject(ApiService);

  private _planName = signal<string>('');
  private _features = signal<PlanFeature[]>([]);
  private _loaded = signal(false);

  readonly planName = this._planName.asReadonly();
  readonly features = this._features.asReadonly();
  readonly loaded = this._loaded.asReadonly();

  loadFromPlanName(planName: string): void {
    this._planName.set(planName);
    const features = PLAN_FEATURES_MAP[planName] ?? [...CORE_FEATURES];
    this._features.set(features);
    this._loaded.set(true);
  }

  hasFeature(feature: PlanFeature): boolean {
    return this._features().includes(feature);
  }

  getFeatureLabel(feature: PlanFeature): string {
    return FEATURE_LABELS[feature] ?? feature;
  }

  getMinimumPlan(feature: PlanFeature): string {
    if (CORE_FEATURES.includes(feature)) return 'Básico';
    if (ADVANCED_FEATURES.includes(feature)) return 'Profesional';
    if (ENTERPRISE_FEATURES.includes(feature)) return 'Empresarial';
    return 'Empresarial';
  }

  reset(): void {
    this._planName.set('');
    this._features.set([]);
    this._loaded.set(false);
  }
}

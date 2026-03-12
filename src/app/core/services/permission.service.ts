import { Injectable, inject, computed } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * Constantes de permisos del sistema — espejo de Permissions.cs del backend
 */
export const PERMISSIONS = {
  // Pacientes
  PatientsView: 'patients.view',
  PatientsCreate: 'patients.create',
  PatientsEdit: 'patients.edit',
  PatientsDelete: 'patients.delete',
  PatientsViewHistory: 'patients.view_history',
  PatientsViewFinancial: 'patients.view_financial',
  PatientsActivate: 'patients.activate',
  PatientsDeactivate: 'patients.deactivate',
  PatientsExport: 'patients.export',
  PatientsMerge: 'patients.merge',

  // Citas
  AppointmentsView: 'appointments.view',
  AppointmentsCreate: 'appointments.create',
  AppointmentsEdit: 'appointments.edit',
  AppointmentsDelete: 'appointments.delete',
  AppointmentsCancelOwn: 'appointments.cancel_own',
  AppointmentsCancelAny: 'appointments.cancel_any',
  AppointmentsCancel: 'appointments.cancel',

  // Tratamientos
  TreatmentsView: 'treatments.view',
  TreatmentsCreate: 'treatments.create',
  TreatmentsEdit: 'treatments.edit',
  TreatmentsDelete: 'treatments.delete',

  // Notas de Consulta
  ConsultationNotesView: 'consultation_notes.view',
  ConsultationNotesCreate: 'consultation_notes.create',
  ConsultationNotesEdit: 'consultation_notes.edit',

  // Recetas
  PrescriptionsView: 'prescriptions.view',
  PrescriptionsCreate: 'prescriptions.create',
  PrescriptionsEdit: 'prescriptions.edit',
  PrescriptionsDelete: 'prescriptions.delete',

  // Planes de Tratamiento
  TreatmentPlansView: 'treatment_plans.view',
  TreatmentPlansCreate: 'treatment_plans.create',
  TreatmentPlansEdit: 'treatment_plans.edit',
  TreatmentPlansApprove: 'treatment_plans.approve',

  // Odontograma
  DentalChartsView: 'dental_charts.view',
  DentalChartsEdit: 'dental_charts.edit',

  // Periodontogramas
  PeriodontogramsView: 'periodontograms.view',
  PeriodontogramsCreate: 'periodontograms.create',
  PeriodontogramsEdit: 'periodontograms.edit',
  PeriodontogramsSign: 'periodontograms.sign',
  PeriodontogramsDelete: 'periodontograms.delete',

  // Cefalometría
  CephalometryView: 'cephalometry.view',
  CephalometryCreate: 'cephalometry.create',
  CephalometryEdit: 'cephalometry.edit',
  CephalometrySign: 'cephalometry.sign',
  CephalometryDelete: 'cephalometry.delete',

  // Notificaciones
  NotificationsView: 'notifications.view',
  NotificationsManage: 'notifications.manage',

  // Archivos Adjuntos
  AttachedFilesView: 'attached_files.view',
  AttachedFilesUpload: 'attached_files.upload',
  AttachedFilesDelete: 'attached_files.delete',

  // Facturas
  InvoicesView: 'invoices.view',
  InvoicesCreate: 'invoices.create',
  InvoicesEdit: 'invoices.edit',
  InvoicesCancel: 'invoices.cancel',

  // Pagos
  PaymentsView: 'payments.view',
  PaymentsCreate: 'payments.create',

  // Usuarios
  UsersView: 'users.view',
  UsersCreate: 'users.create',
  UsersEdit: 'users.edit',
  UsersDelete: 'users.delete',

  // Roles
  RolesView: 'roles.view',
  RolesCreate: 'roles.create',
  RolesEdit: 'roles.edit',
  RolesDelete: 'roles.delete',

  // Tenants
  TenantsView: 'tenants.view',
  TenantsManage: 'tenants.manage',

  // Sucursales / Ubicaciones
  LocationsView: 'locations.view',
  LocationsCreate: 'locations.create',
  LocationsEdit: 'locations.edit',
  LocationsDelete: 'locations.delete',

  // Alergias (NOM-024)
  AllergiesView: 'allergies.view',
  AllergiesCreate: 'allergies.create',
  AllergiesEdit: 'allergies.edit',

  // Consentimientos Informados (NOM-024)
  ConsentsView: 'consents.view',
  ConsentsCreate: 'consents.create',
  ConsentsEdit: 'consents.edit',
  ConsentsSign: 'consents.sign',

  // Plantillas de Consentimiento (NOM-024)
  ConsentTemplatesView: 'consent_templates.view',
  ConsentTemplatesCreate: 'consent_templates.create',
  ConsentTemplatesEdit: 'consent_templates.edit',
  ConsentTemplatesDelete: 'consent_templates.delete',

  // Catálogo CIE-10 (NOM-024)
  Cie10View: 'cie10.view',

  // Diagnósticos (NOM-024)
  DiagnosesView: 'diagnoses.view',
  DiagnosesCreate: 'diagnoses.create',
  DiagnosesEdit: 'diagnoses.edit',

  // Configuración
  SettingsView: 'settings.view',
  SettingsEdit: 'settings.edit',

  // Reportes
  ReportsView: 'reports.view',
  ReportsExport: 'reports.export',
  ReportsExportAnonymized: 'reports.export_anonymized',

  // Inventario
  InventoryView: 'inventory.view',
  InventoryCreate: 'inventory.create',
  InventoryEdit: 'inventory.edit',
  InventoryDelete: 'inventory.delete',
  InventoryPurchaseOrders: 'inventory.purchase_orders',

  // Proveedores
  SuppliersView: 'suppliers.view',
  SuppliersCreate: 'suppliers.create',
  SuppliersEdit: 'suppliers.edit',
  SuppliersDelete: 'suppliers.delete',

  // CFDI / Facturación Electrónica
  CfdiView: 'cfdi.view',
  CfdiGenerate: 'cfdi.generate',
  CfdiCancel: 'cfdi.cancel',

  // Exportación de Datos
  DataExport: 'data_export.export',

  // Auditoría
  AuditLogsView: 'audit_logs.view',

  // Mensajería WhatsApp
  MessagingSend: 'messaging.send',
  MessagingView: 'messaging.view',

  // Suscripciones
  SubscriptionsView: 'subscriptions.view',
  SubscriptionsManage: 'subscriptions.manage',
} as const;

export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * Servicio singleton para validar permisos del usuario autenticado
 */
@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private authService = inject(AuthService);

  /** Permisos efectivos del usuario actual */
  permissions = computed(() => this.authService.currentUser()?.permissions ?? []);

  /** Roles del usuario actual */
  private roles = computed(() => this.authService.currentUser()?.roles ?? []);

  /** Indica si el usuario es Administrador (tiene todos los permisos) */
  isAdmin = computed(() => this.roles().includes('Administrador'));

  /**
   * Verifica si el usuario tiene un permiso específico.
   * Los administradores siempre retornan true.
   */
  hasPermission(permission: string): boolean {
    if (this.isAdmin()) return true;
    return this.permissions().includes(permission);
  }

  /**
   * Verifica si el usuario tiene al menos uno de los permisos indicados.
   */
  hasAnyPermission(permissions: string[]): boolean {
    if (this.isAdmin()) return true;
    return permissions.some(p => this.permissions().includes(p));
  }

  /**
   * Verifica si el usuario tiene todos los permisos indicados.
   */
  hasAllPermissions(permissions: string[]): boolean {
    if (this.isAdmin()) return true;
    return permissions.every(p => this.permissions().includes(p));
  }
}

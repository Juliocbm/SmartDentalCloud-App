export interface AuditLogEntry {
  id: string;
  userId?: string;
  userName: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: string;
  newValues?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface AuditActionConfig {
  readonly icon: string;
  readonly class: string;
  readonly label: string;
}

export const AUDIT_ACTION_CONFIG: Record<string, AuditActionConfig> = {
  Create: { icon: 'fa-plus', class: 'badge-success', label: 'Crear' },
  Update: { icon: 'fa-pen', class: 'badge-info', label: 'Actualizar' },
  Delete: { icon: 'fa-trash', class: 'badge-error', label: 'Eliminar' },
  Login: { icon: 'fa-right-to-bracket', class: 'badge-primary', label: 'Login' },
  Logout: { icon: 'fa-right-from-bracket', class: 'badge-neutral', label: 'Logout' }
};

export const AUDIT_ENTITY_TYPES: { value: string; label: string }[] = [
  { value: 'Patient', label: 'Pacientes' },
  { value: 'Appointment', label: 'Citas' },
  { value: 'Treatment', label: 'Tratamientos' },
  { value: 'TreatmentPlan', label: 'Planes de Tratamiento' },
  { value: 'Service', label: 'Servicios' },
  { value: 'Invoice', label: 'Facturas' },
  { value: 'Payment', label: 'Pagos' },
  { value: 'User', label: 'Usuarios' },
  { value: 'Role', label: 'Roles' },
  { value: 'Product', label: 'Productos' },
  { value: 'Stock', label: 'Stock' },
  { value: 'PurchaseOrder', label: 'Órdenes de Compra' },
  { value: 'Prescription', label: 'Recetas' },
  { value: 'ConsultationNote', label: 'Notas de Consulta' },
  { value: 'Notification', label: 'Notificaciones' },
  { value: 'Tenant', label: 'Configuración' },
  { value: 'Subscription', label: 'Suscripción' }
];

export const AUDIT_ACTIONS: { value: string; label: string }[] = [
  { value: 'Create', label: 'Crear' },
  { value: 'Update', label: 'Actualizar' },
  { value: 'Delete', label: 'Eliminar' },
  { value: 'Login', label: 'Login' },
  { value: 'Logout', label: 'Logout' }
];

export const DEFAULT_AUDIT_ACTION_CONFIG: AuditActionConfig = {
  icon: 'fa-circle', class: 'badge-neutral', label: 'Otro'
};

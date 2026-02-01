export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissionKeys?: string[];
}

export interface UpdateRoleRequest {
  name: string;
  description?: string;
}

export interface UpdateRolePermissionsRequest {
  permissionKeys: string[];
}

export interface Permission {
  id: string;
  key: string;
  description: string;
}

export interface PermissionGroup {
  category: string;
  icon?: string;
  permissions: Permission[];
}

export const PERMISSION_CATEGORIES = {
  PATIENTS: 'Pacientes',
  APPOINTMENTS: 'Citas',
  TREATMENTS: 'Tratamientos',
  INVOICES: 'Facturas',
  PAYMENTS: 'Pagos',
  USERS: 'Usuarios',
  ROLES: 'Roles',
  CONSULTATION_NOTES: 'Notas de Consulta',
  ATTACHED_FILES: 'Archivos Adjuntos',
  SETTINGS: 'Configuración',
  REPORTS: 'Reportes',
  TENANTS: 'Tenants'
} as const;

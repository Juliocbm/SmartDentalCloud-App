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

export const AUDIT_ACTION_CONFIG: Record<string, { icon: string; class: string }> = {
  Create: { icon: 'fa-plus', class: 'badge-success' },
  Update: { icon: 'fa-pen', class: 'badge-info' },
  Delete: { icon: 'fa-trash', class: 'badge-error' },
  Login: { icon: 'fa-right-to-bracket', class: 'badge-primary' },
  Logout: { icon: 'fa-right-from-bracket', class: 'badge-neutral' }
};

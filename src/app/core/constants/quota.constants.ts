export interface QuotaMetadata {
  label: string;
  icon: string;
}

export const QUOTA_METADATA: Record<string, QuotaMetadata> = {
  'Quota:Patients':  { label: 'Pacientes',           icon: 'fa-users' },
  'Quota:Users':     { label: 'Usuarios',            icon: 'fa-user-doctor' },
  'Quota:Locations': { label: 'Sucursales',           icon: 'fa-building' },
  'Quota:StorageMB': { label: 'Almacenamiento (MB)', icon: 'fa-hard-drive' }
};

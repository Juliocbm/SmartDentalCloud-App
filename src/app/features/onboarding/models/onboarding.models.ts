export interface RegisterTenantRequest {
  tenantName: string;
  subdomain: string;
  adminEmail: string;
  adminPassword: string;
  adminName: string;
  timeZone?: string;
}

export interface RegisterTenantResult {
  tenantId: string;
  adminUserId: string;
  authToken: string;
  trialExpiresAt: string;
}

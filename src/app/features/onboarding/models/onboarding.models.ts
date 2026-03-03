export interface RegisterTenantRequest {
  tenantName: string;
  subdomain: string;
  adminEmail: string;
  adminPassword: string;
  adminName: string;
  timeZone?: string;
  planId?: string;
  startWithTrial?: boolean;
  stripePaymentMethodId?: string;
  paymentProvider?: string;
}

export interface RegisterTenantResult {
  tenantId: string;
  adminUserId: string;
  authToken: string;
  trialExpiresAt: string;
}

export interface SubscriptionPlanDto {
  id: string;
  name: string;
  description?: string;
  monthlyPrice: number;
  yearlyPrice?: number;
  patientLimit?: number;
  userLimit?: number;
  locationLimit?: number;
  storageLimitMB?: number;
  features: string[];
  isRecommended: boolean;
}

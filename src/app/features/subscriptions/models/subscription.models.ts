export interface SubscriptionInfo {
  id: string;
  planName: string;
  status: string;
  startDate: string;
  endDate: string;
  stripeSubscriptionId?: string;
  monthlyPrice: number;
  patientLimit: number;
  userLimit: number;
  cancelAtPeriodEnd?: boolean;
  paymentProvider?: string;
  daysRemaining?: number;
}

export interface SubscriptionPlan {
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
  isRecommended?: boolean;
}

export interface SubscriptionLimits {
  status: string;
  isAccessible: boolean;
  limitExceeded: boolean;
  message?: string;
  currentPatients: number;
  patientLimit?: number;
  patientLimitExceeded: boolean;
  currentUsers: number;
  userLimit?: number;
  userLimitExceeded: boolean;
  daysRemaining: number;
  isTrial: boolean;
  planName: string;
}

export const SUBSCRIPTION_STATUS_CONFIG: Record<string, { label: string; class: string; icon: string }> = {
  'Trial': { label: 'Prueba Gratuita', class: 'badge-info', icon: 'fa-flask' },
  'Active': { label: 'Activa', class: 'badge-success', icon: 'fa-check-circle' },
  'PastDue': { label: 'Pago Pendiente', class: 'badge-warning', icon: 'fa-clock' },
  'Canceled': { label: 'Cancelada', class: 'badge-danger', icon: 'fa-times-circle' },
  'Expired': { label: 'Expirada', class: 'badge-neutral', icon: 'fa-calendar-xmark' }
};

export interface StripeConfig {
  publishableKey: string;
}

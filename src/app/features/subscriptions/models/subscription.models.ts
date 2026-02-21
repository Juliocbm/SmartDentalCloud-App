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
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  patientLimit: number;
  userLimit: number;
  features: string[];
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

export const AVAILABLE_PLANS: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Básico',
    monthlyPrice: 499,
    patientLimit: 100,
    userLimit: 3,
    features: ['Citas y Calendario', 'Pacientes', 'Facturación básica', 'Soporte por email']
  },
  {
    id: 'pro',
    name: 'Profesional',
    monthlyPrice: 999,
    patientLimit: 500,
    userLimit: 10,
    features: ['Todo en Básico', 'Reportes avanzados', 'Inventario', 'CFDI / Timbrado', 'Soporte prioritario']
  },
  {
    id: 'enterprise',
    name: 'Empresarial',
    monthlyPrice: 1999,
    patientLimit: -1,
    userLimit: -1,
    features: ['Todo en Profesional', 'Pacientes ilimitados', 'Usuarios ilimitados', 'Dominio personalizado', 'Soporte dedicado']
  }
];

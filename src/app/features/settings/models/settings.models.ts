/**
 * Settings Models — mirrors backend DTOs
 * API: /api/tenants
 */

export interface TenantSettings {
  id: string;
  name: string;
  legalName?: string;
  taxId?: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
  workingHours?: string;
  timeZone: string;
  language: string;
  subdomain: string;
  customDomain?: string;
  createdAt: Date;
  isActive: boolean;
}

export interface UpdateTenantSettingsRequest {
  name: string;
  legalName?: string;
  taxId?: string;
  address?: string;
  phone?: string;
  email?: string;
  workingHours?: string;
  timeZone?: string;
  language?: string;
}

export interface UpdateBrandingRequest {
  logoUrl?: string;
}

export interface UpdateDomainRequest {
  customDomain: string;
}

export interface SmtpConfiguration {
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  fromEmail: string;
  fromName: string;
  useSsl: boolean;
  isEnabled: boolean;
  lastTestedAt?: Date;
  testStatus?: string;
}

export interface ConfigureSmtpRequest {
  smtpHost: string;
  smtpPort: number;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  useSsl: boolean;
}

export interface TestSmtpRequest {
  smtpHost: string;
  smtpPort: number;
  username: string;
  password: string;
  fromEmail: string;
  useSsl: boolean;
}

export interface SmtpTestResult {
  success: boolean;
  message: string;
  errorMessage?: string;
  details?: string;
}

export interface ConfigureSmtpResult {
  testSuccessful: boolean;
  errorMessage?: string;
  fromEmail?: string;
}

export const TIMEZONE_OPTIONS = [
  { value: 'America/Mexico_City', label: 'Ciudad de México (GMT-6)' },
  { value: 'America/Monterrey', label: 'Monterrey (GMT-6)' },
  { value: 'America/Cancun', label: 'Cancún (GMT-5)' },
  { value: 'America/Hermosillo', label: 'Hermosillo (GMT-7)' },
  { value: 'America/Tijuana', label: 'Tijuana (GMT-8)' },
  { value: 'America/Chihuahua', label: 'Chihuahua (GMT-7)' }
];

export const LANGUAGE_OPTIONS = [
  { value: 'es-MX', label: 'Español (México)' },
  { value: 'en-US', label: 'English (US)' }
];

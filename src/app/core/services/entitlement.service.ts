import { Injectable, inject, signal, computed } from '@angular/core';
import { ApiService } from './api.service';
import { PlanFeature } from './feature.service';
import { QUOTA_METADATA } from '../constants/quota.constants';

// ── Models ────────────────────────────────────────────────

export interface QuotaStatus {
  isAllowed: boolean;
  currentUsage: number;
  limit: number | null;
  isNearLimit: boolean;
  usagePercent: number;
}

export interface TenantEntitlementSummary {
  planName: string;
  enabledFeatures: string[];
  /** Features deshabilitadas: featureKey → nombre del plan mínimo que la incluye */
  disabledFeatures: Record<string, string>;
  quotas: Record<string, QuotaStatus>;
  isTrial: boolean;
  daysRemaining: number;
}

// ── Service ───────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class EntitlementService {
  private api = inject(ApiService);

  private _entitlements = signal<TenantEntitlementSummary | null>(null);
  private _loaded = signal(false);

  readonly entitlements = this._entitlements.asReadonly();
  readonly loaded = this._loaded.asReadonly();

  readonly planName = computed(() => this._entitlements()?.planName ?? '');
  readonly isTrial = computed(() => this._entitlements()?.isTrial ?? false);
  readonly daysRemaining = computed(() => this._entitlements()?.daysRemaining ?? 0);
  readonly enabledFeatures = computed(() => this._entitlements()?.enabledFeatures ?? []);

  /** Quotas que están cerca del límite (>= 80%) */
  readonly nearLimitQuotas = computed(() => {
    const quotas = this._entitlements()?.quotas;
    if (!quotas) return [];

    return Object.entries(quotas)
      .filter(([, status]) => status.isNearLimit && status.limit !== null)
      .map(([key, status]) => ({
        key,
        label: QUOTA_METADATA[key]?.label ?? key,
        ...status
      }));
  });

  /**
   * Carga entitlements completos desde el backend.
   * Llamado por featuresLoaderGuard al iniciar la app.
   */
  loadEntitlements(): Promise<void> {
    return new Promise((resolve) => {
      this.api.get<TenantEntitlementSummary>('/subscriptions/entitlements').subscribe({
        next: (summary) => {
          this._entitlements.set(summary);
          this._loaded.set(true);
          resolve();
        },
        error: () => {
          this._entitlements.set(null);
          this._loaded.set(true);
          resolve();
        }
      });
    });
  }

  hasFeature(feature: PlanFeature): boolean {
    return this.enabledFeatures().includes(feature);
  }

  getQuota(quotaKey: string): QuotaStatus | null {
    return this._entitlements()?.quotas?.[quotaKey] ?? null;
  }

  getQuotaLabel(quotaKey: string): string {
    return QUOTA_METADATA[quotaKey]?.label ?? quotaKey;
  }

  getQuotaIcon(quotaKey: string): string {
    return QUOTA_METADATA[quotaKey]?.icon ?? 'fa-circle-question';
  }

  /**
   * Obtiene el nombre del plan mínimo requerido para una feature deshabilitada.
   * Dato proviene del backend (consulta DB), no de un mapa hardcodeado.
   */
  getMinimumPlanForFeature(featureKey: string): string {
    return this._entitlements()?.disabledFeatures?.[featureKey] ?? 'Empresarial';
  }

  /**
   * Fuerza recarga de entitlements (ej: después de cambiar plan).
   */
  async reload(): Promise<void> {
    this._loaded.set(false);
    await this.loadEntitlements();
  }

  reset(): void {
    this._entitlements.set(null);
    this._loaded.set(false);
  }
}

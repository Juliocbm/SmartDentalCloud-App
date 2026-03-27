# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
ng serve                                          # Dev server at http://localhost:4200
ng build --configuration development              # Dev build
ng build                                          # Production build

# Testing
ng test                                           # Run all tests (Karma + Jasmine)
ng test --include='**/patients.service.spec.ts'  # Run a single test file

# Linting
ng lint
```

The dev server proxies `/api` → `https://localhost:7253` (see `proxy.conf.json`).

## Architecture Overview

**Angular 20 SaaS dental clinic management app.** Standalone components, zone-less change detection (`provideZonelessChangeDetection()`), lazy-loaded features, no NgRx.

### Module Structure

```
src/app/
├── core/           # Services, interceptors, guards, models — singleton/app-wide
├── shared/         # Reusable components (sidebar, header, modal, toast, skeleton…)
└── features/       # 25 feature modules — each has components/, services/, models/, *.routes.ts
```

### Routing & Access Control

Routes are defined in `app.routes.ts`. Protected routes use a layered guard chain:

1. `authGuard` — checks authentication
2. `featuresLoaderGuard` — loads entitlements on first protected route entry
3. `permissionGuard(PERMISSION_KEY)` — fine-grained permission check
4. `featureGuard(featureName)` — subscription feature flag check

Feature routes live in `features/[name]/[name].routes.ts` and are lazy-loaded via `loadChildren`.

### HTTP / API Pattern

All HTTP calls go through `ApiService` (`core/services/api.service.ts`), which wraps HttpClient with typed methods (`get<T>`, `post<T>`, `put<T>`, `patch<T>`, `delete<T>`, `postFormData<T>`, `getBlob`). Feature services inject `ApiService` and use `/endpoint` relative paths.

Four function-based interceptors are registered in `app.config.ts`:
- `authInterceptor` — adds Bearer token, handles 401 with automatic token refresh + request retry queue
- `tenantInterceptor` — adds `X-Tenant-Id` for multi-tenancy
- `errorInterceptor` — only shows toast for status 0 (no connection); components handle all other errors
- `subscriptionInterceptor` — handles subscription-related responses

### State Management

Services use Angular Signals (`signal<T>`, `computed()`). Key stateful services:
- `AuthService` — `currentUser`, `isAuthenticated` signals; token stored in `localStorage` (remember me) or `sessionStorage`
- `EntitlementService` — loads subscription plan features/quotas; `loaded` signal gates `featuresLoaderGuard`
- `PermissionService` — derives permissions from current user
- `FeatureService` — derives enabled features from entitlements

### Styling

CSS variable-based design system. Five themes: `light` (default), `dark`, `warm`, `high-contrast`, `pastel`.

- `src/styles/_variables.scss` — all CSS custom properties per theme
- `src/styles/_components.scss` — shared component styles (buttons, cards, badges, KPI cards…)
- `src/styles/_layout.scss` — page containers, dashboard header, section titles
- `src/styles.scss` — root file; `@use` rules **must** come before any `@import url()` calls

Display font (`--font-family-display: 'Syne'`) is used for page titles, section titles, card headers, and `.kpi-value`. Body font is Plus Jakarta Sans.

### Component Conventions

- All components are **standalone** — include imports array, no NgModules
- Use `inject()` instead of constructor injection
- Component styles target max 32kB (build budget warning)
- BEM naming in component SCSS files (e.g., `.sidebar__menu-item--active`)

### Multi-tenancy & i18n

- Every API request carries `X-Tenant-Id` header (added by `tenantInterceptor`)
- Two locales: `en-US` and `es-MX` — translations in `core/i18n/en-US.ts` and `es-MX.ts`

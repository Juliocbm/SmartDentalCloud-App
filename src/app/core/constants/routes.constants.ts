/**
 * Constantes de rutas de la aplicación
 * Centraliza todas las rutas para facilitar refactorización y mantenimiento
 */
export const ROUTES = {
  // Dashboard
  DASHBOARD: '/dashboard',

  // Appointments (Citas)
  APPOINTMENTS: '/appointments',
  APPOINTMENTS_DASHBOARD: '/appointments/dashboard',
  APPOINTMENTS_NEW: '/appointments/new',
  APPOINTMENTS_CALENDAR: '/appointments/calendar',

  // Users (Usuarios)
  USERS: '/users',
  USERS_NEW: '/users/new',

  // Dentists (Dentistas)
  DENTISTS: '/dentists',

  // Patients (Pacientes)
  PATIENTS: '/patients',
  PATIENTS_NEW: '/patients/new',

  // Reception (Recepción)
  RECEPTION: '/reception',

  // Admin
  ADMIN: '/admin',
  ADMIN_APPOINTMENTS: '/admin/appointments',

  // Treatments (Tratamientos)
  TREATMENTS: '/treatments',
  TREATMENTS_NEW: '/treatments/new',

  // Services (Catálogo de Servicios)
  SERVICES: '/services',
  SERVICES_NEW: '/services/new',

  // Treatment Plans (Planes de Tratamiento)
  TREATMENT_PLANS: '/treatment-plans',
  TREATMENT_PLANS_NEW: '/treatment-plans/new',

  // Prescriptions (Recetas)
  PRESCRIPTIONS: '/prescriptions',
  PRESCRIPTIONS_NEW: '/prescriptions/new',

  // Invoices (Facturación)
  INVOICES: '/invoices',
  INVOICES_DASHBOARD: '/invoices',
  INVOICES_LIST: '/invoices/list',
  INVOICES_NEW: '/invoices/new',

  // Payments (Pagos)
  PAYMENTS: '/payments',
  PAYMENTS_NEW: '/payments/new',

  // Reports (Reportes)
  REPORTS: '/reports',
  REPORTS_ACCOUNTS_RECEIVABLE: '/reports/accounts-receivable',
  REPORTS_INCOME: '/reports/income',
  REPORTS_TREATMENTS: '/reports/treatments',
  REPORTS_DENTIST_PRODUCTIVITY: '/reports/dentist-productivity',

  // Notifications (Notificaciones)
  NOTIFICATIONS: '/notifications',

  // Audit Log (Auditoría)
  AUDIT_LOG: '/audit-log',

  // Settings (Configuración)
  SETTINGS: '/settings',

  // Subscriptions (Suscripciones)
  SUBSCRIPTION: '/subscription',

  // CFDI
  CFDI: '/invoices/cfdi',

  // Inventory (Inventario)
  INVENTORY: '/inventory',
  INVENTORY_CATEGORIES: '/inventory/categories',
  INVENTORY_CATEGORIES_NEW: '/inventory/categories/new',
  INVENTORY_PRODUCTS: '/inventory/products',
  INVENTORY_PRODUCTS_NEW: '/inventory/products/new',
  INVENTORY_SUPPLIERS: '/inventory/suppliers',
  INVENTORY_SUPPLIERS_NEW: '/inventory/suppliers/new',
  INVENTORY_ALERTS: '/inventory/alerts'
} as const;

/**
 * Type helper para rutas dinámicas
 */
export const getDynamicRoute = {
  /**
   * Ruta de detalle de paciente
   */
  patientDetail: (patientId: string) => `/patients/${patientId}`,

  /**
   * Ruta de edición de usuario
   */
  userEdit: (userId: string) => `/users/${userId}/edit`,

  /**
   * Ruta de edición de cita
   */
  appointmentEdit: (appointmentId: string) => `/appointments/${appointmentId}/edit`,

  /**
   * Ruta de edición de categoría
   */
  categoryEdit: (categoryId: string) => `/inventory/categories/${categoryId}/edit`,

  /**
   * Ruta de edición de producto
   */
  productEdit: (productId: string) => `/inventory/products/${productId}/edit`,

  /**
   * Ruta de edición de proveedor
   */
  supplierEdit: (supplierId: string) => `/inventory/suppliers/${supplierId}/edit`,

  serviceEdit: (serviceId: string) => `/services/${serviceId}/edit`,

  treatmentPlanDetail: (planId: string) => `/treatment-plans/${planId}`,

  prescriptionDetail: (prescriptionId: string) => `/prescriptions/${prescriptionId}`,

  invoiceDetail: (invoiceId: string) => `/invoices/${invoiceId}`,

  roleEdit: (roleId: string) => `/users/roles/${roleId}/edit`
} as const;

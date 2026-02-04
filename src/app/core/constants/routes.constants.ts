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
  supplierEdit: (supplierId: string) => `/inventory/suppliers/${supplierId}/edit`
} as const;

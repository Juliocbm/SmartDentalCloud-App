/**
 * Location (Sucursal) Models — mirrors backend DTOs
 * API: /api/locations
 */

export interface Location {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string | null;
  assignedUsers: LocationUser[];
}

export interface LocationSummary {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface LocationUser {
  userId: string;
  userName: string;
}

export interface CreateLocationRequest {
  name: string;
  address: string;
  phone?: string | null;
  email?: string | null;
  isDefault: boolean;
  sortOrder: number;
}

export interface UpdateLocationRequest {
  id: string;
  name: string;
  address: string;
  phone?: string | null;
  email?: string | null;
  isDefault: boolean;
  sortOrder: number;
}

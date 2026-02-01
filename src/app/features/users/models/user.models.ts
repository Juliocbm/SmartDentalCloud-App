export interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  roles: Role[];
  permissions: string[];
  profile?: UserProfile;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  roleIds?: string[];
  phoneNumber?: string;
  specialty?: string;
  professionalLicense?: string;
}

export interface UpdateUserRequest {
  name: string;
  email: string;
  phoneNumber?: string;
  specialty?: string;
  professionalLicense?: string;
}

export interface UserProfile {
  phoneNumber?: string;
  alternateEmail?: string;
  address?: string;
  professionalLicense?: string;
  specialty?: string;
  yearsOfExperience?: number;
  education?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bio?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions?: string[];
}

export interface UserFilters {
  searchTerm?: string;
  isActive?: boolean;
  roleId?: string;
}

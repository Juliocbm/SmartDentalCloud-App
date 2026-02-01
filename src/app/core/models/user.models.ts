export interface User {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];
  isActive: boolean;
  specialization?: string;
  licenseNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  Admin = 'Admin',
  Doctor = 'Odontólogo',
  Receptionist = 'Receptionist',
  Assistant = 'Assistant'
}

export interface DoctorListItem {
  id: string;
  name: string;
  specialization?: string;
}

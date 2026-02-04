import { ROUTES } from '../../../core/constants/routes.constants';

export interface UserFormContext {
  contextRole: string;
  requiredRoleId: string | null;
  returnUrl: string;
}

export const DEFAULT_USER_CONTEXT: UserFormContext = {
  contextRole: 'Usuario',
  requiredRoleId: null,
  returnUrl: ROUTES.USERS
};

export const DENTIST_CONTEXT: Partial<UserFormContext> = {
  contextRole: 'Dentista',
  requiredRoleId: 'Dentista',
  returnUrl: ROUTES.DENTISTS
};

export const RECEPTIONIST_CONTEXT: Partial<UserFormContext> = {
  contextRole: 'Recepcionista',
  requiredRoleId: 'Recepcionista',
  returnUrl: ROUTES.RECEPTION
};

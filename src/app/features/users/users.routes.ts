import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/auth.guard';
import { PERMISSIONS } from '../../core/services/permission.service';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/user-list/user-list').then(m => m.UserListComponent)
  },
  {
    path: 'new',
    canActivate: [permissionGuard(PERMISSIONS.UsersCreate)],
    loadComponent: () => import('./components/user-form/user-form').then(m => m.UserFormComponent)
  },
  {
    path: 'roles',
    children: [
      {
        path: '',
        loadComponent: () => import('./components/role-list/role-list').then(m => m.RoleListComponent)
      },
      {
        path: 'new',
        canActivate: [permissionGuard(PERMISSIONS.RolesCreate)],
        loadComponent: () => import('./components/role-form/role-form').then(m => m.RoleFormComponent)
      },
      {
        path: ':id/edit',
        canActivate: [permissionGuard(PERMISSIONS.RolesEdit)],
        loadComponent: () => import('./components/role-form/role-form').then(m => m.RoleFormComponent)
      }
    ]
  },
  {
    path: ':id',
    loadComponent: () => import('./components/user-detail/user-detail').then(m => m.UserDetailComponent)
  },
  {
    path: ':id/edit',
    canActivate: [permissionGuard(PERMISSIONS.UsersEdit)],
    loadComponent: () => import('./components/user-form/user-form').then(m => m.UserFormComponent)
  }
];

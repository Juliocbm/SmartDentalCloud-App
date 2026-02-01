import { Routes } from '@angular/router';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/user-list/user-list').then(m => m.UserListComponent)
  },
  {
    path: 'new',
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
        loadComponent: () => import('./components/role-form/role-form').then(m => m.RoleFormComponent)
      },
      {
        path: ':id/edit',
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
    loadComponent: () => import('./components/user-form/user-form').then(m => m.UserFormComponent)
  }
];

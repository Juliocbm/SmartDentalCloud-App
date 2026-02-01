import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('access_token');
  
  // No agregar token a rutas de auth públicas
  const isAuthEndpoint = req.url.includes('/auth/login') || 
                        req.url.includes('/auth/refresh') || 
                        req.url.includes('/auth/forgot-password') ||
                        req.url.includes('/auth/reset-password');
  
  if (token && !isAuthEndpoint) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthEndpoint) {
        // Token inválido o expirado
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('current_user');
        localStorage.removeItem('token_expiry');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};

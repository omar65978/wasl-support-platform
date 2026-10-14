import { inject, provideZoneChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { CanActivateFn, Router, provideRouter, withHashLocation } from '@angular/router';
import type { Role } from '@wasl/shared';
import { AppComponent } from './app.component';
import { AppState } from './state';
import { AuthComponent } from './auth.component';
function allowRoles(roles: Role[]): CanActivateFn {
  return () => {
    const s = inject(AppState);
    const router = inject(Router);
    const evaluate = () => {
      if (s.auth.getSnapshot().recovery !== 'none') return router.createUrlTree(['/sign-in']);
      const profile = s.auth.getSnapshot().profile;
      if (!profile || profile.role === 'customer') return router.createUrlTree(['/sign-in']);
      return roles.includes(profile.role) || router.createUrlTree(['/requests']);
    };
    if (!s.auth.getSnapshot().loading) return evaluate();
    return new Promise((resolve) => {
      const unsubscribe = s.auth.subscribe(() => {
        if (!s.auth.getSnapshot().loading) {
          unsubscribe();
          resolve(evaluate());
        }
      });
    });
  };
}
bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      [
        { path: 'sign-in', component: AuthComponent },
        {
          path: 'requests',
          canActivate: [allowRoles(['agent', 'manager'])],
          loadComponent: () => import('./queue.component').then((m) => m.QueueComponent),
        },
        {
          path: 'requests/:id',
          canActivate: [allowRoles(['agent', 'manager'])],
          loadComponent: () => import('./detail.component').then((m) => m.DetailComponent),
        },
        {
          path: 'overview',
          canActivate: [allowRoles(['manager'])],
          loadComponent: () => import('./overview.component').then((m) => m.OverviewComponent),
        },
        { path: '', pathMatch: 'full', redirectTo: 'requests' },
        { path: '**', redirectTo: 'requests' },
      ],
      withHashLocation(),
    ),
  ],
}).catch((error) => {
  document.body.textContent = 'Unable to initialize the workspace. Reload the page.';
  console.error(error);
});

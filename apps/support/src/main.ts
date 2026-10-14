import { inject, provideZoneChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { CanActivateFn, Router, provideRouter, withHashLocation } from '@angular/router';
import { AppComponent } from './app.component';
import { AppState } from './state';
import { AuthComponent } from './auth.component';
const authenticated: CanActivateFn = () => {
  const s=inject(AppState);const router=inject(Router);
  const evaluate=()=>{const p=s.session().profile;return p&&p.role!=='customer'?true:router.createUrlTree(['/sign-in']);};
  if(!s.session().loading)return evaluate();
  return new Promise(resolve=>{const unsubscribe=s.auth.subscribe(()=>{if(!s.auth.getSnapshot().loading){unsubscribe();resolve(evaluate());}});});
};
const manager: CanActivateFn = () => { const s=inject(AppState);const router=inject(Router);return s.session().profile?.role==='manager'||router.createUrlTree(['/requests']); };
bootstrapApplication(AppComponent,{providers:[provideZoneChangeDetection({eventCoalescing:true}),provideRouter([
  {path:'sign-in',component:AuthComponent},
  {path:'requests',canActivate:[authenticated],loadComponent:()=>import('./queue.component').then(m=>m.QueueComponent)},
  {path:'requests/:id',canActivate:[authenticated],loadComponent:()=>import('./detail.component').then(m=>m.DetailComponent)},
  {path:'overview',canActivate:[authenticated,manager],loadComponent:()=>import('./overview.component').then(m=>m.OverviewComponent)},
  {path:'',pathMatch:'full',redirectTo:'requests'},
  {path:'**',redirectTo:'requests'}
],withHashLocation())]}).catch(error=>{document.body.textContent='Unable to initialize the workspace. Reload the page.';console.error(error);});

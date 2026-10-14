import { Component, effect, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { applicationUrl } from '@wasl/shared';
import { AppState } from './state';
import { AuthComponent } from './auth.component';
import { IconComponent } from './icon.component';
@Component({
  selector: 'wasl-app',
  standalone: true,
  imports: [RouterLink, RouterOutlet, AuthComponent, IconComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
  readonly s = inject(AppState);
  readonly router = inject(Router);
  readonly customerUrl = applicationUrl('customer');
  menuOpen = false;
  error: unknown;
  constructor() {
    effect(() => {
      const session = this.s.session();
      if (
        session.profile &&
        session.profile.role !== 'customer' &&
        this.router.url.startsWith('/sign-in')
      )
        this.router.navigateByUrl('/requests');
    });
  }
  async signOut() {
    try {
      await this.s.auth.signOut();
      await this.router.navigateByUrl('/sign-in');
    } catch (e) {
      this.error = e;
    }
  }
  closeMenu() {
    this.menuOpen = false;
  }
  active(kind: string) {
    const url = this.router.url;
    if (kind === 'overview') return url.startsWith('/overview');
    if (kind === 'mine') return url.includes('owner=mine');
    if (kind === 'unassigned') return url.includes('owner=unassigned');
    if (kind === 'urgent') return url.includes('urgency=urgent');
    return url.startsWith('/requests') && !url.includes('?');
  }
}

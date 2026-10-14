import { Component, HostListener, effect, inject } from '@angular/core';
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
  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    if (this.menuOpen)
      setTimeout(() => document.querySelector<HTMLElement>('.workspace-sidebar a')?.focus());
  }
  closeMenu() {
    const wasOpen = this.menuOpen;
    this.menuOpen = false;
    if (wasOpen) document.querySelector<HTMLElement>('.mobile-menu')?.focus();
  }
  @HostListener('document:keydown', ['$event'])
  handleMenuKeyboard(event: KeyboardEvent) {
    if (!this.menuOpen) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeMenu();
    }
    if (event.key !== 'Tab') return;
    const items = Array.from(
      document.querySelectorAll<HTMLElement>('.workspace-sidebar a, .workspace-sidebar button'),
    ).filter((element) => element.getClientRects().length > 0);
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
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

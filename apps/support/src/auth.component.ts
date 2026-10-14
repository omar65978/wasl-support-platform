import { ThemeToggleComponent } from './theme-toggle.component';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { applicationUrl } from '@wasl/shared';
import { AppState } from './state';
import { IconComponent } from './icon.component';
@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [ThemeToggleComponent, FormsModule, IconComponent],
  template: `
    <main class="auth-page">
      <section class="auth-story">
        <span class="brand brand-light">
          <span class="brand-symbol"></span>
          {{ s.t('brand') }}
        </span>
        <div class="auth-story-content">
          <h1>{{ s.t('staffLoginTitle') }}</h1>
          <p>{{ s.t('staffLoginBody') }}</p>
          <div class="auth-illustration">
            <div class="thread-line">
              <span class="thread-node"><app-icon name="inbox" [size]="14" /></span>
              {{ s.t('allRequests') }}
            </div>
            <div class="thread-line">
              <span class="thread-node"><app-icon name="users" [size]="14" /></span>
              {{ s.t('heroOwnership') }}
            </div>
            <div class="thread-line">
              <span class="thread-node done"><app-icon name="check" [size]="14" /></span>
              {{ s.t('heroResolution') }}
            </div>
          </div>
        </div>
        <div class="auth-story-bottom">
          <app-icon name="lock" [size]="14" />
          {{ s.t('securityNote') }}
        </div>
      </section>
      <section class="auth-main">
        <div class="auth-preferences">
          <app-theme-toggle />
          <button
            class="btn btn-quiet"
            (click)="s.toggleLanguage()"
            [attr.aria-label]="s.t('switchLanguage')"
          >
            <app-icon name="globe" [size]="16" />
            {{ s.t('language') }}
          </button>
        </div>
        <div class="auth-form">
          <h2>
            {{
              s.t(
                completed
                  ? 'passwordUpdated'
                  : resetting
                    ? 'resetTitle'
                    : requesting
                      ? 'forgotTitle'
                      : 'loginTitle'
              )
            }}
          </h2>
          <p>
            {{
              s.t(
                completed
                  ? 'passwordUpdatedBody'
                  : resetting
                    ? 'resetBody'
                    : requesting
                      ? 'forgotBody'
                      : 'supportWorkspace'
              )
            }}
          </p>
          @if (s.session().recovery === 'invalid') {
            <div class="alert alert-error" role="alert">{{ s.t('recoveryInvalid') }}</div>
          }
          @if (error || (!recovering && s.session().error)) {
            <div class="alert alert-error" role="alert">
              {{ s.error(error || s.session().error) }}
            </div>
          }
          @if (sent) {
            <div class="alert alert-success" role="status">{{ s.t('resetEmailSent') }}</div>
          }
          @if (!completed) {
            <form (ngSubmit)="submit()" ngNativeValidate>
              @if (!resetting) {
                <div class="field">
                  <label for="email">{{ s.t('email') }}</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    dir="ltr"
                    autocomplete="email"
                    [(ngModel)]="email"
                    (ngModelChange)="sent = false"
                    required
                    placeholder="you@company.com"
                    [disabled]="busy"
                  />
                </div>
              }
              @if (!requesting) {
                <div class="field">
                  <label for="password">{{ s.t(resetting ? 'newPassword' : 'password') }}</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    [attr.autocomplete]="resetting ? 'new-password' : 'current-password'"
                    [(ngModel)]="password"
                    [attr.minlength]="resetting ? 12 : null"
                    required
                    [disabled]="busy"
                  />
                  @if (resetting) {
                    <small>{{ s.t('passwordHelp') }}</small>
                  }
                </div>
              }
              @if (resetting) {
                <div class="field">
                  <label for="confirmation">{{ s.t('confirmPassword') }}</label>
                  <input
                    id="confirmation"
                    name="confirmation"
                    type="password"
                    autocomplete="new-password"
                    [(ngModel)]="confirmation"
                    minlength="12"
                    required
                    [disabled]="busy"
                  />
                </div>
              }
              <button class="btn btn-primary" [disabled]="busy || (requesting && sent)">
                {{
                  s.t(
                    requesting
                      ? busy
                        ? 'sendingReset'
                        : 'sendResetLink'
                      : resetting
                        ? busy
                          ? 'savingPassword'
                          : 'savePassword'
                        : busy
                          ? 'signInPending'
                          : 'signIn'
                  )
                }}
              </button>
            </form>
          }
          @if (requesting || recovering) {
            <div class="auth-footer">
              <button
                [class]="completed ? 'btn btn-primary' : 'text-link'"
                [disabled]="busy"
                (click)="backToSignIn()"
              >
                {{ s.t('backSignIn') }}
              </button>
            </div>
          } @else {
            <div class="auth-footer">
              <button class="text-link" [disabled]="busy" (click)="openRecovery()">
                {{ s.t('forgotPassword') }}
              </button>
            </div>
            <p class="auth-footer">{{ s.t('forgotHint') }}</p>
          }
          @if (!requesting && !recovering) {
            <div class="demo-options">
              <p>{{ s.t('demo') }}</p>
              <div class="flex">
                <button class="btn btn-secondary" (click)="s.auth.enterDemo('agent')">
                  {{ s.t('demoAgent') }}
                </button>
                <button class="btn btn-secondary" (click)="s.auth.enterDemo('manager')">
                  {{ s.t('demoManager') }}
                </button>
              </div>
            </div>
            <a class="auth-workspace-link" [href]="customerUrl">{{ s.t('customerPortal') }} ↗</a>
          }
        </div>
      </section>
    </main>
  `,
})
export class AuthComponent {
  readonly s = inject(AppState);
  readonly customerUrl = applicationUrl('customer');
  email = '';
  password = '';
  confirmation = '';
  forgot = false;
  sent = false;
  busy = false;
  error: unknown;
  get recovering() {
    return this.s.session().recovery !== 'none';
  }
  get resetting() {
    return this.s.session().recovery === 'ready';
  }
  get requesting() {
    return this.forgot || this.s.session().recovery === 'invalid';
  }
  get completed() {
    return this.s.session().recovery === 'complete';
  }
  openRecovery() {
    this.forgot = true;
    this.error = null;
    this.password = '';
  }
  async backToSignIn() {
    if (this.busy) return;
    this.busy = true;
    this.error = null;
    try {
      if (this.recovering) await this.s.auth.leaveRecovery();
      else {
        this.forgot = false;
        this.sent = false;
        this.password = '';
        this.confirmation = '';
      }
    } catch (e) {
      this.error = e;
    } finally {
      this.busy = false;
    }
  }
  async submit() {
    if (this.busy || (this.requesting && this.sent)) return;
    this.busy = true;
    this.error = null;
    try {
      if (this.requesting) {
        await this.s.auth.requestPasswordReset(this.email);
        this.sent = true;
      } else if (this.resetting) {
        await this.s.auth.updatePassword(this.password, this.confirmation);
        this.password = '';
        this.confirmation = '';
      } else await this.s.auth.signIn(this.email, this.password);
    } catch (e) {
      this.error = e;
    } finally {
      this.busy = false;
    }
  }
}

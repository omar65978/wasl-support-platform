import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import {
  AuthController,
  getTheme,
  initializeTheme,
  subscribeTheme,
  toggleTheme,
  Repository,
  getLanguage,
  setLanguage,
  translate,
  errorKey,
  formatDate,
  initials,
  activityKey,
  type TranslationKey,
  type Language,
} from '@wasl/shared';
@Injectable({ providedIn: 'root' })
export class AppState {
  readonly auth = new AuthController('support');
  readonly api = new Repository(this.auth);
  readonly session = signal(this.auth.getSnapshot());
  readonly language = signal<Language>(getLanguage());
  readonly theme = signal(getTheme());
  readonly toggleTheme = toggleTheme;
  readonly notice = signal<TranslationKey | null>(null);
  private timeout?: ReturnType<typeof setTimeout>;
  constructor() {
    initializeTheme();
    this.theme.set(getTheme());
    const stopTheme = subscribeTheme(() => this.theme.set(getTheme()));
    inject(DestroyRef).onDestroy(stopTheme);
    setLanguage(this.language());
    this.auth.subscribe(() => this.session.set(this.auth.getSnapshot()));
    this.auth.init();
  }
  t = (key: TranslationKey) => translate(this.language(), key);
  error = (error: unknown) => this.t(errorKey(error));
  date = (date: string, time = false) => formatDate(date, this.language(), time);
  initials = initials;
  activity = (action: string) => this.t(activityKey(action));
  toggleLanguage() {
    this.language.update((l) => (l === 'en' ? 'ar' : 'en'));
    setLanguage(this.language());
  }
  notify(key: TranslationKey) {
    clearTimeout(this.timeout);
    this.notice.set(key);
    this.timeout = setTimeout(() => this.notice.set(null), 6000);
  }
}

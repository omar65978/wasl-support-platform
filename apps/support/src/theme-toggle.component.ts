import { Component, inject } from '@angular/core';
import { AppState } from './state';
import { IconComponent } from './icon.component';
@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [IconComponent],
  template: `
    <button
      type="button"
      class="theme-toggle"
      (click)="s.toggleTheme()"
      [attr.aria-label]="s.t(s.theme() === 'dark' ? 'switchToLight' : 'switchToDark')"
      [title]="s.t(s.theme() === 'dark' ? 'switchToLight' : 'switchToDark')"
    >
      <app-icon [name]="s.theme() === 'dark' ? 'sun' : 'moon'" [size]="17" />
    </button>
  `,
})
export class ThemeToggleComponent {
  readonly s = inject(AppState);
}

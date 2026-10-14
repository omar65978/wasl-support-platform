import { Component, Input } from '@angular/core';
@Component({
  selector: 'app-icon',
  standalone: true,
  template: `
    <svg
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.7"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path [attr.d]="paths[name] || paths['request']" />
    </svg>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        vertical-align: middle;
        flex-shrink: 0;
      }
    `,
  ],
})
export class IconComponent {
  @Input() name = 'request';
  @Input() size = 18;
  paths: Record<string, string> = {
    sun: 'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M12 2v2 M12 20v2 M2 12h2 M20 12h2 M5 5l1.5 1.5 M17.5 17.5L19 19 M5 19l1.5-1.5 M17.5 6.5L19 5',
    moon: 'M21 13a9 9 0 0 1-10-10 9 9 0 1 0 10 10',
    request: 'M8 3h8l4 4v14H4V3h4 M8 11h8 M8 15h6 M15 3v5h5',
    grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
    inbox: 'M4 4h16l2 11v5H2v-5L4 4 M2 15h6l2 3h4l2-3h6',
    user: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-2a8 8 0 0 1 16 0v2',
    users:
      'M14 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M3 21v-2a8 8 0 0 1 16 0v2 M18 4a4 4 0 0 1 0 7 M19 14a6 6 0 0 1 3 5',
    clock: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0 M12 6v6l4 2',
    bolt: 'M13 2L4 14h7l-1 8L21 9h-8l1-7',
    search: 'M20 20l-5-5 M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
    filter: 'M3 6h18 M3 12h18 M3 18h18 M7 3v6 M16 9v6 M10 15v6',
    globe:
      'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0 M2 12h20 M12 2a18 18 0 0 1 0 20 18 18 0 0 1 0-20',
    logout: 'M9 3H3v18h6 M12 12h10 M18 8l4 4-4 4',
    refresh: 'M20 7a9 9 0 1 0 1 10 M20 3v5h-5',
    arrow: 'M4 12h16 M14 6l6 6-6 6',
    back: 'M20 12H4 M10 6l-6 6 6 6',
    chevron: 'M9 5l7 7-7 7',
    check: 'M5 12l4 4L19 6',
    close: 'M6 6l12 12 M18 6L6 18',
    menu: 'M3 6h18 M3 12h18 M3 18h18',
    message: 'M21 3H3v14h5l4 4 4-4h5V3 M7 8h10 M7 12h6',
    lock: 'M5 10h14v11H5z M8 10V6a4 4 0 0 1 8 0v4 M12 15v2',
    attach: 'M8 12l7-7a4 4 0 0 1 6 6L10 22a6 6 0 0 1-8-8L13 3 M6 16l10-10',
    download: 'M12 3v12 M7 10l5 5 5-5 M3 16v5h18v-5',
    send: 'M22 2L9 15 M22 2l-7 20-6-7-7-6 20-7',
    chart: 'M4 3v18h18 M8 16v-4 M13 16V7 M18 16V3',
    help: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0 M9 8a3 3 0 0 1 6 0c0 2-3 2-3 5 M12 17h.01',
    shield: 'M12 2l9 4v6c0 5-9 10-9 10S3 17 3 12V6l9-4 M8 12l3 3 5-6',
    billing: 'M2 5h20v14H2z M2 10h20 M6 15h3',
    technical:
      'M10 2h4l1 3 3 1 3-1 2 4-3 2v3l3 2-2 4-3-1-3 1-1 3h-4l-1-3-3-1-3 1-2-4 3-2v-3L1 9l2-4 3 1 3-1 1-3 M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    account: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-2a8 8 0 0 1 16 0v2',
    general: 'M21 3H3v14h5l4 4 4-4h5V3 M7 8h10 M7 12h6',
  };
}

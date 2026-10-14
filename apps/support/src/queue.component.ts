import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  CATEGORIES,
  URGENCIES,
  STATUSES,
  PAGE_SIZE,
  defaultFilters,
  emptySummary,
  type RequestFilters,
  type RequestPage,
  type Summary,
  type Profile,
} from '@wasl/shared';
import { AppState } from './state';
import { IconComponent } from './icon.component';
@Component({
  selector: 'app-queue',
  standalone: true,
  imports: [FormsModule, RouterLink, IconComponent],
  templateUrl: './queue.component.html',
})
export class QueueComponent implements OnInit, OnDestroy {
  readonly s = inject(AppState);
  private route = inject(ActivatedRoute);
  readonly categories = CATEGORIES;
  readonly urgencies = URGENCIES;
  readonly statuses = STATUSES;
  filters = defaultFilters();
  search = '';
  data: RequestPage = { items: [], total: 0 };
  summary: Summary = emptySummary();
  employees: Profile[] = [];
  loading = true;
  error: unknown;
  expanded = false;
  private generation = 0;
  private polling?: ReturnType<typeof setInterval>;
  private debounce?: ReturnType<typeof setTimeout>;
  private subscription?: Subscription;
  private alive = true;
  private pending = false;
  get pages() {
    return Math.max(1, Math.ceil(this.data.total / PAGE_SIZE));
  }
  get title() {
    return this.filters.owner === 'mine'
      ? 'myQueue'
      : this.filters.owner === 'unassigned'
        ? 'unassigned'
        : this.filters.urgency === 'urgent'
          ? 'urgentQueue'
          : 'allRequests';
  }
  ngOnInit() {
    this.subscription = this.route.queryParams.subscribe((params) => {
      this.filters = {
        ...defaultFilters(),
        owner: params['owner'] || 'all',
        urgency: params['urgency'] === 'urgent' ? 'urgent' : 'all',
      };
      this.search = '';
      this.load(true);
    });
    this.polling = setInterval(() => {
      if (!document.hidden && !this.pending) this.load();
    }, 15000);
  }
  ngOnDestroy() {
    this.alive = false;
    this.generation++;
    clearInterval(this.polling);
    clearTimeout(this.debounce);
    this.subscription?.unsubscribe();
  }
  async load(initial = false) {
    const id = ++this.generation;
    this.pending = true;
    if (initial) this.loading = true;
    try {
      const [data, summary] = await Promise.all([
        this.s.api.list(this.filters),
        this.s.api.summary(),
      ]);
      if (this.alive && id === this.generation) {
        this.data = data;
        this.summary = summary;
        this.error = null;
      }
    } catch (e) {
      if (this.alive && id === this.generation) this.error = e;
    } finally {
      if (this.alive && id === this.generation) {
        this.loading = false;
        this.pending = false;
      }
    }
  }
  update() {
    this.filters.page = 1;
    this.load(true);
  }
  searchChanged() {
    clearTimeout(this.debounce);
    this.debounce = setTimeout(() => {
      this.filters.search = this.search;
      this.update();
    }, 350);
  }
  clear() {
    this.filters = defaultFilters();
    this.search = '';
    this.load(true);
  }
  page(delta: number) {
    this.filters.page += delta;
    this.load(true);
  }
  selectStatus(status: RequestFilters['status']) {
    this.filters.status = status;
    this.update();
  }
}

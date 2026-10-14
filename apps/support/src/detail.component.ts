import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  MESSAGE_PAGE_SIZE,
  URGENCIES,
  canManage,
  type Attachment,
  type Profile,
  type RequestAction,
  type RequestDetail,
  type TranslationKey,
} from '@wasl/shared';
import { AppState } from './state';
import { IconComponent } from './icon.component';
@Component({
  selector: 'app-detail',
  standalone: true,
  imports: [FormsModule, RouterLink, IconComponent],
  templateUrl: './detail.component.html',
})
export class DetailComponent implements OnInit, OnDestroy {
  readonly s = inject(AppState);
  private route = inject(ActivatedRoute);
  readonly urgencies = URGENCIES;
  id = '';
  data: RequestDetail | null = null;
  employees: Profile[] = [];
  loading = true;
  busy = false;
  error: unknown;
  actionError: unknown;
  body = '';
  internal = false;
  resolution = '';
  showResolve = false;
  assignedTo = '';
  selectedUrgency = 'normal';
  limit = MESSAGE_PAGE_SIZE;
  private generation = 0;
  private poll?: ReturnType<typeof setInterval>;
  private sub?: Subscription;
  private alive = true;
  private pending = false;
  get canManage() {
    return !!this.data && canManage(this.s.session().profile!, this.data.request);
  }
  get isManager() {
    return this.s.session().profile?.role === 'manager';
  }
  ngOnInit() {
    this.sub = this.route.params.subscribe((params) => {
      this.id = params['id'];
      this.body = '';
      this.resolution = '';
      this.data = null;
      this.limit = MESSAGE_PAGE_SIZE;
      this.loading = true;
      this.load();
    });
    this.poll = setInterval(() => {
      if (!document.hidden && !this.pending && !this.busy) this.load();
    }, 15000);
    if (this.isManager)
      this.s.api
        .employees()
        .then((p) => {
          if (this.alive) this.employees = p;
        })
        .catch((e) => (this.actionError = e));
  }
  ngOnDestroy() {
    this.alive = false;
    this.generation++;
    clearInterval(this.poll);
    this.sub?.unsubscribe();
  }
  async load() {
    const id = ++this.generation;
    this.pending = true;
    try {
      const data = await this.s.api.detail(this.id, this.limit);
      if (this.alive && id === this.generation) {
        this.data = data;
        this.error = null;
        if (!this.assignedTo) this.assignedTo = data.request.assigned_to || '';
        this.selectedUrgency = data.request.urgency;
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
  async change(action: RequestAction, value?: string) {
    if (!this.data || this.busy) return;
    this.busy = true;
    this.actionError = null;
    try {
      await this.s.api.change(this.id, this.data.request.version, action, value);
      const messages: Partial<Record<RequestAction, TranslationKey>> = {
        claim: 'claimSuccess',
        assign: 'assignSuccess',
        resolve: 'resolveSuccess',
        reopen: 'reopenSuccess',
      };
      this.s.notify(messages[action] || 'updateSuccess');
      this.showResolve = false;
      this.resolution = '';
      await this.load();
    } catch (e) {
      this.actionError = e;
      await this.load();
    } finally {
      this.busy = false;
    }
  }
  async send() {
    if (!this.data || this.busy) return;
    this.busy = true;
    this.actionError = null;
    try {
      await this.s.api.send(this.id, this.data.request.version, this.body, this.internal);
      this.body = '';
      this.s.notify(this.internal ? 'noteSuccess' : 'messageSuccess');
      await this.load();
    } catch (e) {
      this.actionError = e;
      await this.load();
    } finally {
      this.busy = false;
    }
  }
  async upload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || this.busy) return;
    this.busy = true;
    this.actionError = null;
    try {
      await this.s.api.upload(this.id, file, this.internal);
      this.s.notify('uploadSuccess');
      await this.load();
    } catch (e) {
      this.actionError = e;
    } finally {
      this.busy = false;
    }
  }
  async download(file: Attachment) {
    this.actionError = null;
    try {
      await this.s.api.download(file);
    } catch (e) {
      this.actionError = e;
    }
  }
  older() {
    this.limit += MESSAGE_PAGE_SIZE;
    this.load();
  }
}

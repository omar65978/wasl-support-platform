import { canManage, emptySummary, MESSAGE_PAGE_SIZE, PAGE_SIZE, validateRequest } from './types';
import type {
  Activity,
  Attachment,
  Message,
  NewRequest,
  Profile,
  RequestAction,
  RequestDetail,
  RequestFilters,
  RequestPage,
  Role,
  Summary,
  SupportRequest,
  Workload,
} from './types';
const key = 'wasl:demo:data:v1';
export const demoProfiles: Profile[] = [
  { id: '11111111-1111-4111-8111-111111111111', full_name: 'Lina Hassan', role: 'customer' },
  { id: '22222222-2222-4222-8222-222222222222', full_name: 'Omar Saleh', role: 'agent' },
  { id: '33333333-3333-4333-8333-333333333333', full_name: 'Nadia Farouk', role: 'manager' },
  { id: '44444444-4444-4444-8444-444444444444', full_name: 'Mariam Ali', role: 'customer' },
  { id: '55555555-5555-4555-8555-555555555555', full_name: 'Youssef Adel', role: 'agent' },
];
interface DemoData {
  requests: SupportRequest[];
  messages: Message[];
  activities: Activity[];
  attachments: Attachment[];
}
const titles = [
  'Unable to download my monthly invoice',
  'Workspace invitations are not arriving',
  'Update the billing address on my account',
  'Dashboard takes too long to load',
  'Can I export my request history?',
  'Two-factor authentication on a new phone',
  'Payment was taken twice this month',
  'Help connecting our new team workspace',
  'Search results disappear after refresh',
  'A question about account permissions',
  'Receipt missing from confirmation email',
  'Profile photo is not updating',
  'Notifications arrive in the wrong timezone',
  'Need to change our subscription contact',
  'Shared links return an access error',
  'Request to update company details',
  'Unexpected sign-out on mobile',
  'Checking our latest payment status',
];
function seed(): DemoData {
  const now = Date.now();
  const requests = titles.map((title, i): SupportRequest => {
    const customer = demoProfiles[i < 7 ? 0 : 3];
    const status = (
      [
        'in_progress',
        'waiting_customer',
        'new',
        'resolved',
        'resolved',
        'in_progress',
        'new',
      ] as const
    )[i % 7];
    const owner = status === 'new' ? null : demoProfiles[i % 3 === 0 ? 1 : 4];
    return {
      id: `a0000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
      reference: `WS-${1041 + i}`,
      title,
      description:
        i === 0
          ? 'I can see the latest invoice in my billing dashboard, but clicking Download opens a blank page. I have tried Chrome and Safari and the same thing happens. Could you help me get a PDF copy for our records?'
          : `I need some help with this: ${title.toLowerCase()}. The issue started yesterday and I have already tried signing out and signing back in. Please let me know what other information would be useful.`,
      customer_id: customer.id,
      assigned_to: owner?.id || null,
      customer,
      owner,
      category: (
        ['billing', 'account', 'billing', 'technical', 'general', 'account', 'billing'] as const
      )[i % 7],
      urgency: (['normal', 'high', 'normal', 'low', 'low', 'high', 'urgent'] as const)[i % 7],
      status,
      resolution:
        status === 'resolved'
          ? 'We identified the issue and updated the account settings. The service is working as expected now. Please reopen this request if you need any further help.'
          : null,
      version: 1,
      created_at: new Date(now - (i + 2) * 86400000).toISOString(),
      updated_at: new Date(now - i * 12600000 - 1800000).toISOString(),
      resolved_at: status === 'resolved' ? new Date(now - i * 12600000).toISOString() : null,
    };
  });
  const r = requests[0];
  return {
    requests,
    attachments: [],
    messages: [
      {
        id: crypto.randomUUID(),
        request_id: r.id,
        author_id: demoProfiles[1].id,
        author: demoProfiles[1],
        body: 'Hi Lina, thanks for flagging this. I’ve been able to reproduce the download issue and I’m checking it with our billing team. You won’t need to make any changes to your account.',
        internal: false,
        created_at: new Date(now - 7200000).toISOString(),
      },
      {
        id: crypto.randomUUID(),
        request_id: r.id,
        author_id: demoProfiles[1].id,
        author: demoProfiles[1],
        body: 'The PDF generation job is timing out. Check the billing worker before sending the customer a replacement invoice.',
        internal: true,
        created_at: new Date(now - 3600000).toISOString(),
      },
    ],
    activities: requests.map((request) => ({
      id: crypto.randomUUID(),
      request_id: request.id,
      actor: request.customer,
      action: 'created',
      detail: null,
      created_at: request.created_at,
    })),
  };
}
function load(): DemoData {
  try {
    const value = localStorage.getItem(key);
    if (value) return JSON.parse(value);
  } catch {
    localStorage.removeItem(key);
  }
  const data = seed();
  save(data);
  return data;
}
function save(data: DemoData) {
  localStorage.setItem(key, JSON.stringify(data));
}
export function resetDemo() {
  localStorage.removeItem(key);
}
export function demoProfile(role: Role) {
  return demoProfiles.find((p) => p.role === role)!;
}
export class DemoRepository {
  constructor(private profile: () => Profile) {}
  private visible(r: SupportRequest) {
    return this.profile().role !== 'customer' || r.customer_id === this.profile().id;
  }
  private request(data: DemoData, id: string) {
    const r = data.requests.find((r) => r.id === id);
    if (!r || !this.visible(r)) throw new Error('FORBIDDEN');
    return r;
  }
  private event(data: DemoData, r: SupportRequest, action: string, detail: string | null = null) {
    r.version++;
    r.updated_at = new Date().toISOString();
    data.activities.push({
      id: crypto.randomUUID(),
      request_id: r.id,
      actor: this.profile(),
      action,
      detail,
      created_at: r.updated_at,
    });
    save(data);
  }
  async list(filters: RequestFilters): Promise<RequestPage> {
    let items = load().requests.filter((r) => this.visible(r));
    if (filters.search)
      items = items.filter((r) =>
        `${r.title} ${r.description} ${r.reference}`
          .toLowerCase()
          .includes(filters.search.toLowerCase()),
      );
    if (filters.status === 'active') items = items.filter((r) => r.status !== 'resolved');
    else if (filters.status !== 'all') items = items.filter((r) => r.status === filters.status);
    if (filters.urgency !== 'all') items = items.filter((r) => r.urgency === filters.urgency);
    if (filters.category !== 'all') items = items.filter((r) => r.category === filters.category);
    if (filters.owner === 'unassigned') items = items.filter((r) => !r.assigned_to);
    else if (filters.owner !== 'all')
      items = items.filter(
        (r) => r.assigned_to === (filters.owner === 'mine' ? this.profile().id : filters.owner),
      );
    const rank = { urgent: 0, high: 1, normal: 2, low: 3 };
    items.sort((a, b) =>
      filters.sort === 'oldest'
        ? a.created_at.localeCompare(b.created_at)
        : filters.sort === 'urgency'
          ? rank[a.urgency] - rank[b.urgency] || a.created_at.localeCompare(b.created_at)
          : b.updated_at.localeCompare(a.updated_at),
    );
    return {
      total: items.length,
      items: items.slice((filters.page - 1) * PAGE_SIZE, filters.page * PAGE_SIZE),
    };
  }
  async detail(id: string, messageLimit = MESSAGE_PAGE_SIZE): Promise<RequestDetail> {
    const data = load();
    const request = this.request(data, id);
    const messages = data.messages.filter(
      (m) => m.request_id === id && (!m.internal || this.profile().role !== 'customer'),
    );
    return {
      request,
      messages: messages.slice(-messageLimit),
      hasMoreMessages: messages.length > messageLimit,
      attachments: [],
      activities: data.activities
        .filter(
          (a) =>
            a.request_id === id &&
            (!a.action.startsWith('internal') || this.profile().role !== 'customer'),
        )
        .reverse()
        .slice(0, 40),
    };
  }
  async create(input: NewRequest): Promise<string> {
    validateRequest(input);
    if (this.profile().role !== 'customer') throw new Error('FORBIDDEN');
    const data = load();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const request: SupportRequest = {
      ...input,
      title: input.title.trim(),
      description: input.description.trim(),
      id,
      reference: `WS-${Math.max(1040, ...data.requests.map((r) => Number(r.reference.slice(3)))) + 1}`,
      customer_id: this.profile().id,
      customer: this.profile(),
      assigned_to: null,
      owner: null,
      status: 'new',
      resolution: null,
      version: 0,
      created_at: now,
      updated_at: now,
      resolved_at: null,
    };
    data.requests.unshift(request);
    this.event(data, request, 'created');
    return id;
  }
  async change(id: string, version: number, action: RequestAction, value?: string) {
    const data = load();
    const r = this.request(data, id);
    const p = this.profile();
    if (version !== r.version) throw new Error('CONFLICT');
    if (action === 'claim') {
      if (p.role === 'customer') throw new Error('FORBIDDEN');
      if (r.assigned_to || r.status === 'resolved') throw new Error('INVALID_STATE');
      r.assigned_to = p.id;
      r.owner = p;
      r.status = 'in_progress';
    } else if (action === 'assign') {
      if (p.role !== 'manager') throw new Error('FORBIDDEN');
      const owner = demoProfiles.find((x) => x.id === value && x.role !== 'customer');
      if (!owner) throw new Error('INVALID_OWNER');
      r.assigned_to = owner.id;
      r.owner = owner;
      if (r.status === 'new') r.status = 'in_progress';
    } else if (action === 'reopen') {
      if (r.status !== 'resolved') throw new Error('INVALID_STATE');
      if (p.role === 'agent' && !canManage(p, r)) throw new Error('NOT_OWNER');
      r.status = 'in_progress';
      r.resolution = null;
      r.resolved_at = null;
    } else {
      if (!canManage(p, r)) throw new Error('NOT_OWNER');
      if (r.status === 'resolved' || !r.assigned_to) throw new Error('INVALID_STATE');
      if (action === 'resolve') {
        if ((value?.trim().length || 0) < 10) throw new Error('RESOLUTION_REQUIRED');
        r.status = 'resolved';
        r.resolution = value!.trim();
        r.resolved_at = new Date().toISOString();
      } else if (action === 'urgency') r.urgency = value as SupportRequest['urgency'];
      else r.status = action;
    }
    this.event(
      data,
      r,
      action,
      action === 'assign' ? r.owner?.full_name : action === 'urgency' ? value : null,
    );
  }
  async send(id: string, version: number, body: string, internal: boolean) {
    const data = load();
    const r = this.request(data, id);
    const p = this.profile();
    if (version !== r.version) throw new Error('CONFLICT');
    if (r.status === 'resolved') throw new Error('REQUEST_CLOSED');
    if ((internal && p.role === 'customer') || (p.role === 'agent' && !canManage(p, r)))
      throw new Error('FORBIDDEN');
    if (!body.trim() || body.trim().length > 10000) throw new Error('INVALID_MESSAGE');
    data.messages.push({
      id: crypto.randomUUID(),
      request_id: id,
      author_id: p.id,
      author: p,
      body: body.trim(),
      internal,
      created_at: new Date().toISOString(),
    });
    if (p.role === 'customer' && r.status === 'waiting_customer') r.status = 'in_progress';
    this.event(data, r, internal ? 'internal_note' : 'reply');
  }
  async summary(): Promise<Summary> {
    const s = emptySummary();
    for (const r of load().requests.filter((r) => this.visible(r))) {
      s.total++;
      if (r.status === 'resolved') s.resolved++;
      else {
        s.active++;
        if (!r.assigned_to) s.unassigned++;
        if (r.assigned_to === this.profile().id) s.mine++;
        if (r.urgency === 'urgent') s.urgent++;
      }
      if (r.status === 'waiting_customer') s.waiting++;
    }
    return s;
  }
  async employees() {
    return demoProfiles.filter((p) => p.role !== 'customer');
  }
  async workload(): Promise<Workload[]> {
    if (this.profile().role !== 'manager') throw new Error('FORBIDDEN');
    const data = load();
    return (await this.employees()).map((p) => {
      const own = data.requests.filter((r) => r.assigned_to === p.id);
      return {
        ...p,
        active: own.filter((r) => r.status !== 'resolved').length,
        waiting: own.filter((r) => r.status === 'waiting_customer').length,
        resolved: own.filter((r) => r.status === 'resolved').length,
        urgent: own.filter((r) => r.urgency === 'urgent' && r.status !== 'resolved').length,
      };
    });
  }
}

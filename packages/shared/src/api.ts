import { supabase } from './client';
import { DemoRepository } from './demo';
import { MESSAGE_PAGE_SIZE, PAGE_SIZE, validateFile, validateRequest } from './types';
import type { AuthController } from './auth';
import type { Attachment, NewRequest, Profile, RequestAction, RequestDetail, RequestFilters, RequestPage, Summary, Workload } from './types';
const requestSelect = 'id,reference,customer_id,assigned_to,title,description,category,urgency,status,resolution,version,created_at,updated_at,resolved_at,customer:profiles!requests_customer_id_fkey(id,full_name,role),owner:profiles!requests_assigned_to_fkey(id,full_name,role)';
export class Repository {
  private demo: DemoRepository;
  constructor(private auth: AuthController) { this.demo = new DemoRepository(() => this.profile); }
  private get profile() { const p = this.auth.getSnapshot().profile; if (!p) throw new Error('SESSION_EXPIRED'); return p; }
  private get isDemo() { return this.auth.getSnapshot().demo; }
  async list(filters: RequestFilters): Promise<RequestPage> {
    if (this.isDemo) return this.demo.list(filters);
    let query = supabase.from('requests').select(requestSelect, { count: 'exact' });
    if (filters.search.trim()) query = query.textSearch('search_document', filters.search.trim().slice(0, 200), { config: 'simple', type: 'websearch' });
    if (filters.status === 'active') query = query.neq('status', 'resolved'); else if (filters.status !== 'all') query = query.eq('status', filters.status);
    if (filters.urgency !== 'all') query = query.eq('urgency', filters.urgency);
    if (filters.category !== 'all') query = query.eq('category', filters.category);
    if (filters.owner === 'unassigned') query = query.is('assigned_to', null); else if (filters.owner !== 'all') query = query.eq('assigned_to', filters.owner === 'mine' ? this.profile.id : filters.owner);
    if (filters.sort === 'urgency') query = query.order('urgency_rank').order('created_at');
    else query = query.order(filters.sort === 'oldest' ? 'created_at' : 'updated_at', { ascending: filters.sort === 'oldest' });
    const start = (Math.max(1, filters.page) - 1) * PAGE_SIZE;
    const { data, error, count } = await query.order('id').range(start, start + PAGE_SIZE - 1);
    if (error) throw error;
    return { items: data as unknown as RequestPage['items'], total: count || 0 };
  }
  async detail(id: string, limit = MESSAGE_PAGE_SIZE): Promise<RequestDetail> {
    if (this.isDemo) return this.demo.detail(id, limit);
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error('FORBIDDEN');
    const [request, messages, attachments, activities] = await Promise.all([
      supabase.from('requests').select(requestSelect).eq('id',id).single(),
      supabase.from('messages').select('*,author:profiles!messages_author_id_fkey(id,full_name,role)').eq('request_id',id).order('created_at', { ascending: false }).order('id').limit(limit + 1),
      supabase.from('attachments').select('*').eq('request_id',id).eq('ready',true).order('created_at').limit(50),
      supabase.from('activities').select('*,actor:profiles!activities_actor_id_fkey(id,full_name,role)').eq('request_id',id).order('created_at', { ascending: false }).order('id').limit(40)
    ]);
    if (request.error?.code === 'PGRST116') throw new Error('FORBIDDEN');
    for (const response of [request, messages, attachments, activities]) if (response.error) throw response.error;
    return { request: request.data, messages: messages.data!.slice(0, limit).reverse(), hasMoreMessages: messages.data!.length > limit, attachments: attachments.data, activities: activities.data } as unknown as RequestDetail;
  }
  async create(input: NewRequest): Promise<string> {
    validateRequest(input);
    if (this.isDemo) return this.demo.create(input);
    const { data,error } = await supabase.rpc('create_request', { p_title: input.title.trim(), p_description: input.description.trim(), p_category: input.category, p_urgency: input.urgency });
    if (error) throw error; return data;
  }
  async change(id: string, version: number, action: RequestAction, value?: string) {
    if (this.isDemo) return this.demo.change(id,version,action,value);
    const { error } = await supabase.rpc('change_request', { p_id: id, p_version: version, p_action: action, p_value: value || null });
    if (error) throw error;
  }
  async send(id: string, version: number, body: string, internal = false) {
    if (!body.trim() || body.trim().length > 10000) throw new Error('INVALID_MESSAGE');
    if (this.isDemo) return this.demo.send(id,version,body,internal);
    const { error } = await supabase.rpc('send_message', { p_id: id, p_version: version, p_body: body.trim(), p_internal: internal });
    if (error) throw error;
  }
  async summary(): Promise<Summary> { if (this.isDemo) return this.demo.summary(); const { data,error } = await supabase.rpc('request_summary'); if (error) throw error; return data; }
  async employees(): Promise<Profile[]> { if (this.isDemo) return this.demo.employees(); const { data,error } = await supabase.from('profiles').select('id,full_name,role').in('role',['agent','manager']).order('full_name').limit(1000); if (error) throw error; return data; }
  async workload(): Promise<Workload[]> { if (this.isDemo) return this.demo.workload(); const { data,error } = await supabase.rpc('manager_workload'); if (error) throw error; return data; }
  async upload(id: string, file: File, internal = false) {
    await validateFile(file);
    if (this.isDemo) throw new Error('DEMO_FILES');
    const { data,error } = await supabase.rpc('reserve_attachment', { p_id:id, p_name:file.name, p_mime:file.type, p_size:file.size, p_internal:internal }).single();
    if (error) throw error;
    const attachment = data as Attachment;
    try {
      const upload = await supabase.storage.from('request-attachments').upload(attachment.storage_path, file, { contentType: file.type, upsert:false });
      if (upload.error) throw upload.error;
      const finish = await supabase.rpc('finish_attachment', { p_id: attachment.id }); if (finish.error) throw finish.error;
    } catch (failure) {
      const removed = await supabase.storage.from('request-attachments').remove([attachment.storage_path]);
      if (!removed.error) await supabase.rpc('finish_attachment', { p_id:attachment.id, p_cancel:true });
      throw failure;
    }
  }
  async download(attachment: Attachment) {
    const { data,error } = await supabase.storage.from('request-attachments').download(attachment.storage_path);
    if (error) throw error;
    const url = URL.createObjectURL(data); const anchor = document.createElement('a'); anchor.href = url; anchor.download = attachment.name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
}

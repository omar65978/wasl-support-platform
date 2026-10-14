export type Role = 'customer' | 'agent' | 'manager';
export type Status = 'new' | 'in_progress' | 'waiting_customer' | 'resolved';
export type Urgency = 'low' | 'normal' | 'high' | 'urgent';
export type Category = 'account' | 'billing' | 'technical' | 'general';
export type Language = 'en' | 'ar';
export interface Profile { id: string; full_name: string; role: Role }
export interface SupportRequest {
  id: string; reference: string; customer_id: string; assigned_to: string | null;
  title: string; description: string; category: Category; urgency: Urgency; status: Status;
  resolution: string | null; version: number; created_at: string; updated_at: string; resolved_at: string | null;
  customer: Profile; owner: Profile | null;
}
export interface Message { id: string; request_id: string; author_id: string; body: string; internal: boolean; created_at: string; author: Profile }
export interface Activity { id: string; request_id: string; action: string; detail: string | null; created_at: string; actor: Profile }
export interface Attachment { id: string; request_id: string; name: string; mime_type: string; size: number; internal: boolean; ready: boolean; storage_path: string; created_at: string }
export interface RequestDetail { request: SupportRequest; messages: Message[]; attachments: Attachment[]; activities: Activity[]; hasMoreMessages: boolean }
export interface RequestFilters { search: string; status: Status | 'all' | 'active'; urgency: Urgency | 'all'; owner: 'all' | 'mine' | 'unassigned' | string; category: Category | 'all'; sort: 'updated' | 'oldest' | 'urgency'; page: number }
export interface RequestPage { items: SupportRequest[]; total: number }
export interface Summary { total: number; active: number; waiting: number; resolved: number; urgent: number; unassigned: number; mine: number }
export interface Workload { id: string; full_name: string; role: Role; active: number; waiting: number; resolved: number; urgent: number }
export interface NewRequest { title: string; description: string; category: Category; urgency: Urgency }
export type RequestAction = 'claim' | 'assign' | 'reopen' | 'in_progress' | 'waiting_customer' | 'resolve' | 'urgency';
export const PAGE_SIZE = 12;
export const MESSAGE_PAGE_SIZE = 40;
export const STATUSES: Status[] = ['new', 'in_progress', 'waiting_customer', 'resolved'];
export const URGENCIES: Urgency[] = ['low', 'normal', 'high', 'urgent'];
export const CATEGORIES: Category[] = ['account', 'billing', 'technical', 'general'];
export const defaultFilters = (): RequestFilters => ({ search: '', status: 'all', urgency: 'all', owner: 'all', category: 'all', sort: 'updated', page: 1 });
export const emptySummary = (): Summary => ({ total: 0, active: 0, waiting: 0, resolved: 0, urgent: 0, unassigned: 0, mine: 0 });
export function canManage(profile: Profile, request: SupportRequest) { return profile.role === 'manager' || (profile.role === 'agent' && request.assigned_to === profile.id); }
export function validateRequest(input: NewRequest) {
  if (input.title.trim().length < 5 || input.title.trim().length > 140) throw new Error('INVALID_TITLE');
  if (input.description.trim().length < 20 || input.description.trim().length > 10000) throw new Error('INVALID_DESCRIPTION');
  if (!CATEGORIES.includes(input.category) || !URGENCIES.includes(input.urgency)) throw new Error('INVALID_REQUEST');
}
export async function validateFile(file: File) {
  if (file.size < 1 || file.size > 5242880) throw new Error('FILE_SIZE');
  if (file.name.length > 180) throw new Error('FILE_NAME');
  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const png = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71 && bytes[4] === 13 && bytes[5] === 10 && bytes[6] === 26 && bytes[7] === 10;
  const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const pdf = String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-';
  if (!((file.type === 'image/png' && png) || (file.type === 'image/jpeg' && jpg) || (file.type === 'application/pdf' && pdf))) throw new Error('INVALID_FILE');
}

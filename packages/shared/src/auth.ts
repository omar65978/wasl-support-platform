import { supabase } from './client';
import { demoProfile } from './demo';
import type { Profile, Role } from './types';
export interface AuthState { profile: Profile | null; loading: boolean; error: unknown; demo: boolean }
export class AuthController {
  private listeners = new Set<() => void>();
  private generation = 0;
  private state: AuthState = { profile: null, loading: true, error: null, demo: false };
  private key: string;
  constructor(experience: 'customer' | 'support') { this.key = `wasl:demo:${experience}`; }
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private update(next: Partial<AuthState>) { this.state = { ...this.state, ...next }; this.listeners.forEach(l => l()); }
  async init() {
    const role = sessionStorage.getItem(this.key) as Role | null;
    if (role && ['customer','agent','manager'].includes(role)) { this.update({ profile: demoProfile(role), loading: false, demo: true }); return () => {}; }
    const subscription = supabase.auth.onAuthStateChange((_event, session) => { queueMicrotask(() => this.loadProfile(session?.user.id)); });
    const { data, error } = await supabase.auth.getSession();
    if (error) this.update({ error, loading: false }); else await this.loadProfile(data.session?.user.id);
    return () => subscription.data.subscription.unsubscribe();
  }
  private async loadProfile(id?: string) {
    if (this.state.demo) return;
    const generation = ++this.generation;
    if (!id) { this.update({ profile: null, loading: false }); return; }
    if (this.state.profile?.id === id) return;
    this.update({ loading: true });
    const { data, error } = await supabase.from('profiles').select('id,full_name,role').eq('id', id).single();
    if (generation === this.generation) this.update({ profile: data as Profile | null, error, loading: false });
  }
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
    await this.loadProfile(data.user.id);
    if (this.state.error) throw this.state.error;
  }
  async register(name: string, email: string, password: string) {
    if (password.length < 12) throw new Error('INVALID_PASSWORD');
    if (!name.trim() || name.trim().length > 100) throw new Error('INVALID_NAME');
    const { error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: name.trim() } } });
    if (error) throw error;
  }
  enterDemo(role: Role) { sessionStorage.setItem(this.key,role); this.generation++; this.update({ profile: demoProfile(role), loading: false, demo: true, error: null }); }
  async signOut() {
    if (!this.state.demo) { const { error } = await supabase.auth.signOut({ scope: 'local' }); if (error) throw error; }
    sessionStorage.removeItem(this.key); this.generation++; this.update({ profile: null, loading: false, demo: false, error: null });
  }
}

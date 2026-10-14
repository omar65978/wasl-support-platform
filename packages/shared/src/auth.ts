import { supabase } from './client';
import { applicationUrl } from './config';
import { demoProfile } from './demo';
import type { Profile, Role } from './types';
import { isRecoveryCallback, takeRecoveryTokens, type RecoveryState } from './recovery';
export interface AuthState {
  profile: Profile | null;
  loading: boolean;
  error: unknown;
  demo: boolean;
  recovery: RecoveryState;
}
export class AuthController {
  private listeners = new Set<() => void>();
  private generation = 0;
  private state: AuthState = {
    profile: null,
    loading: true,
    error: null,
    demo: false,
    recovery: isRecoveryCallback ? 'verifying' : 'none',
  };
  private recoveryInit?: Promise<void>;
  private experience: 'customer' | 'support';
  private key: string;
  constructor(experience: 'customer' | 'support') {
    this.key = `wasl:demo:${experience}`;
    this.experience = experience;
  }
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private update(next: Partial<AuthState>) {
    this.state = { ...this.state, ...next };
    this.listeners.forEach((l) => l());
  }
  async init() {
    const subscription = supabase.auth.onAuthStateChange((_event, session) => {
      if (this.state.recovery !== 'none') return;
      queueMicrotask(() => this.loadProfile(session?.user.id));
    });
    if (isRecoveryCallback) {
      this.recoveryInit ??= this.initializeRecovery();
      await this.recoveryInit;
      return () => subscription.data.subscription.unsubscribe();
    }
    const role = sessionStorage.getItem(this.key) as Role | null;
    if (role && ['customer', 'agent', 'manager'].includes(role)) {
      this.update({ profile: demoProfile(role), loading: false, demo: true });
      return () => subscription.data.subscription.unsubscribe();
    }
    const { data, error } = await supabase.auth.getSession();
    if (error) this.update({ error, loading: false });
    else await this.loadProfile(data.session?.user.id);
    return () => subscription.data.subscription.unsubscribe();
  }
  private async loadProfile(id?: string) {
    if (this.state.demo || this.state.recovery !== 'none') return;
    const generation = ++this.generation;
    if (!id) {
      this.update({ profile: null, loading: false });
      return;
    }
    if (this.state.profile?.id === id) return;
    this.update({ loading: true });
    const { data, error } = await supabase
      .from('profiles')
      .select('id,full_name,role')
      .eq('id', id)
      .single();
    if (generation === this.generation && this.state.recovery === 'none')
      this.update({
        profile: data as Profile | null,
        error: error?.code === 'PGRST116' ? new Error('PROFILE_MISSING') : error,
        loading: false,
      });
  }
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
    await this.loadProfile(data.user.id);
    if (this.state.error) throw this.state.error;
  }
  async register(name: string, email: string, password: string) {
    if (password.length < 12) throw new Error('INVALID_PASSWORD');
    if (!name.trim() || name.trim().length > 100) throw new Error('INVALID_NAME');
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: name.trim() },
        emailRedirectTo: new URL(applicationUrl('customer'), window.location.origin).href,
      },
    });
    if (error) throw error;
  }
  private async initializeRecovery() {
    this.generation++;
    sessionStorage.removeItem('wasl:demo:customer');
    sessionStorage.removeItem('wasl:demo:support');
    const tokens = takeRecoveryTokens();
    if (!tokens) {
      this.update({ recovery: 'invalid', loading: false, profile: null, demo: false, error: null });
      return;
    }
    try {
      const { data, error } = await supabase.auth.setSession(tokens);
      if (error || !data.session || !data.user) throw error || new Error('RECOVERY_INVALID');
      this.update({ recovery: 'ready', loading: false, profile: null, demo: false, error: null });
    } catch {
      this.update({ recovery: 'invalid', loading: false, profile: null, demo: false, error: null });
    }
  }
  async requestPasswordReset(email: string) {
    const address = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) throw new Error('INVALID_EMAIL');
    const redirect = new URL(applicationUrl(this.experience), window.location.origin);
    redirect.searchParams.set('auth', 'recovery');
    const { error } = await supabase.auth.resetPasswordForEmail(address, {
      redirectTo: redirect.href,
    });
    if (error) throw error;
  }
  async updatePassword(password: string, confirmation: string) {
    if (this.state.recovery !== 'ready' || this.state.demo) throw new Error('RECOVERY_INVALID');
    if (password.length < 12) throw new Error('INVALID_PASSWORD');
    if (password !== confirmation) throw new Error('PASSWORD_MISMATCH');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      if (
        ['session_not_found', 'refresh_token_not_found', 'refresh_token_already_used'].includes(
          error.code || '',
        ) ||
        error.status === 401
      ) {
        this.update({ recovery: 'invalid' });
        throw new Error('RECOVERY_INVALID');
      }
      throw error;
    }
    this.update({ recovery: 'complete', profile: null, error: null });
  }
  async leaveRecovery() {
    if (this.state.recovery === 'ready' || this.state.recovery === 'complete') {
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw new Error('RECOVERY_SIGNOUT_FAILED');
    }
    window.location.replace(new URL(applicationUrl(this.experience), window.location.origin).href);
  }
  enterDemo(role: Role) {
    if (this.state.recovery !== 'none') return;
    sessionStorage.setItem(this.key, role);
    this.generation++;
    this.update({ profile: demoProfile(role), loading: false, demo: true, error: null });
  }
  async signOut() {
    if (!this.state.demo) {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw error;
    }
    sessionStorage.removeItem(this.key);
    this.generation++;
    this.update({ profile: null, loading: false, demo: false, error: null });
  }
}

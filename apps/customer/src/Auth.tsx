import { useState, type FormEvent } from 'react';
import {
  ArrowUpRight,
  Check,
  Eye,
  EyeOff,
  Globe2,
  LockKeyhole,
  MessageCircle,
  UserRound,
} from 'lucide-react';
import { applicationUrl } from '@wasl/shared';
import { auth, ErrorNotice, useApp, useAuth } from './context';
export function Brand({ light = false }: { light?: boolean }) {
  const { t } = useApp();
  return (
    <span className={`brand ${light ? 'brand-light' : ''}`}>
      <span className="brand-symbol" aria-hidden="true" />
      {t('brand')}
    </span>
  );
}
export function AuthPage() {
  const { t, toggleLanguage, notify } = useApp();
  const session = useAuth();
  const [register, setRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (register) {
        await auth.register(name, email, password);
        notify('registered');
        setRegister(false);
      } else await auth.signIn(email, password);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-page">
      <section className="auth-story">
        <Brand light />
        <div className="auth-story-content">
          <h1>{t('welcome')}</h1>
          <p>{t('welcomeBody')}</p>
          <div className="auth-illustration">
            <div className="thread-line">
              <span className="thread-node">
                <MessageCircle size={13} />
              </span>
              {t('heroTracking')}
            </div>
            <div className="thread-line">
              <span className="thread-node">
                <UserRound size={13} />
              </span>
              {t('heroOwnership')}
            </div>
            <div className="thread-line">
              <span className="thread-node done">
                <Check size={14} />
              </span>
              {t('heroResolution')}
            </div>
          </div>
        </div>
        <div className="auth-story-bottom">
          <LockKeyhole size={14} />
          {t('securityNote')}
        </div>
      </section>
      <section className="auth-main">
        <button
          className="btn btn-quiet auth-language"
          onClick={toggleLanguage}
          aria-label={t('switchLanguage')}
        >
          <Globe2 size={16} />
          {t('language')}
        </button>
        <div className="auth-form">
          <h2>{t(register ? 'register' : 'loginTitle')}</h2>
          <p>{t('loginBody')}</p>
          <ErrorNotice error={error || session.error} />
          <form onSubmit={submit}>
            {register && (
              <div className="field">
                <label htmlFor="name">{t('name')}</label>
                <input
                  id="name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={100}
                />
              </div>
            )}
            <div className="field">
              <label htmlFor="email">{t('email')}</label>
              <input
                id="email"
                type="email"
                dir="ltr"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
              />
            </div>
            <div className="field">
              <label htmlFor="password">{t('password')}</label>
              <div className="password-wrap">
                <input
                  id="password"
                  type={show ? 'text' : 'password'}
                  autoComplete={register ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={register ? 12 : undefined}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  aria-label={t(show ? 'hidePassword' : 'showPassword')}
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {register && <small>{t('passwordHelp')}</small>}
            </div>
            <button className="btn btn-primary" disabled={busy}>
              {t(busy ? 'signInPending' : register ? 'register' : 'signIn')}
            </button>
          </form>
          <div className="auth-footer">
            {t(register ? 'haveAccount' : 'needAccount')}{' '}
            <button
              className="text-link"
              onClick={() => {
                setRegister(!register);
                setError(null);
              }}
            >
              {t(register ? 'signIn' : 'register')}
            </button>
          </div>
          <div className="demo-options">
            <p>{t('demo')}</p>
            <button
              className="btn btn-secondary"
              style={{ width: '100%' }}
              onClick={() => auth.enterDemo('customer')}
            >
              {t('demoCustomer')}
              <ArrowUpRight size={14} />
            </button>
          </div>
          <a className="auth-workspace-link" href={applicationUrl('support')}>
            {t('supportWorkspace')} ↗
          </a>
        </div>
      </section>
    </main>
  );
}

import { ThemeToggle } from './ThemeToggle';
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
  const [forgot, setForgot] = useState(false);
  const [sent, setSent] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const recovering = session.recovery !== 'none';
  const resetting = session.recovery === 'ready';
  const requesting = forgot || session.recovery === 'invalid';
  const completed = session.recovery === 'complete';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || (requesting && sent)) return;
    setBusy(true);
    setError(null);
    try {
      if (requesting) {
        await auth.requestPasswordReset(email);
        setSent(true);
      } else if (resetting) {
        await auth.updatePassword(password, confirmation);
        setPassword('');
        setConfirmation('');
      } else if (register) {
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
  async function backToSignIn() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (recovering) await auth.leaveRecovery();
      else {
        setForgot(false);
        setRegister(false);
        setSent(false);
        setPassword('');
        setConfirmation('');
      }
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
        <div className="auth-preferences">
          <ThemeToggle />
          <button
            className="btn btn-quiet"
            onClick={toggleLanguage}
            aria-label={t('switchLanguage')}
          >
            <Globe2 size={16} />
            {t('language')}
          </button>
        </div>
        <div className="auth-form">
          <h2>
            {t(
              completed
                ? 'passwordUpdated'
                : resetting
                  ? 'resetTitle'
                  : requesting
                    ? 'forgotTitle'
                    : register
                      ? 'register'
                      : 'loginTitle',
            )}
          </h2>
          <p>
            {t(
              completed
                ? 'passwordUpdatedBody'
                : resetting
                  ? 'resetBody'
                  : requesting
                    ? 'forgotBody'
                    : 'loginBody',
            )}
          </p>
          {session.recovery === 'invalid' && (
            <div className="alert alert-error" role="alert">
              {t('recoveryInvalid')}
            </div>
          )}
          <ErrorNotice error={error || (!recovering && session.error)} />
          {sent && (
            <div className="alert alert-success" role="status">
              {t('resetEmailSent')}
            </div>
          )}
          {!completed && (
            <form onSubmit={submit}>
              {register && !requesting && !resetting && (
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
              {!resetting && (
                <div className="field">
                  <label htmlFor="email">{t('email')}</label>
                  <input
                    id="email"
                    type="email"
                    dir="ltr"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setSent(false);
                    }}
                    required
                    placeholder="you@company.com"
                    disabled={busy}
                  />
                </div>
              )}
              {!requesting && (
                <div className="field">
                  <label htmlFor="password">{t(resetting ? 'newPassword' : 'password')}</label>
                  <div className="password-wrap">
                    <input
                      id="password"
                      type={show ? 'text' : 'password'}
                      autoComplete={register || resetting ? 'new-password' : 'current-password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={register || resetting ? 12 : undefined}
                      required
                      disabled={busy}
                    />
                    <button
                      type="button"
                      onClick={() => setShow(!show)}
                      aria-label={t(show ? 'hidePassword' : 'showPassword')}
                    >
                      {show ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {(register || resetting) && <small>{t('passwordHelp')}</small>}
                </div>
              )}
              {resetting && (
                <div className="field">
                  <label htmlFor="confirmation">{t('confirmPassword')}</label>
                  <input
                    id="confirmation"
                    type={show ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    minLength={12}
                    required
                    disabled={busy}
                  />
                </div>
              )}
              <button className="btn btn-primary" disabled={busy || (requesting && sent)}>
                {t(
                  requesting
                    ? busy
                      ? 'sendingReset'
                      : 'sendResetLink'
                    : resetting
                      ? busy
                        ? 'savingPassword'
                        : 'savePassword'
                      : busy
                        ? 'signInPending'
                        : register
                          ? 'register'
                          : 'signIn',
                )}
              </button>
            </form>
          )}
          {!register && !requesting && !recovering && (
            <div className="auth-footer">
              <button
                className="text-link"
                disabled={busy}
                onClick={() => {
                  setForgot(true);
                  setError(null);
                  setPassword('');
                  setShow(false);
                }}
              >
                {t('forgotPassword')}
              </button>
            </div>
          )}
          {requesting || recovering ? (
            <div className="auth-footer">
              <button
                className={completed ? 'btn btn-primary' : 'text-link'}
                disabled={busy}
                onClick={backToSignIn}
              >
                {t('backSignIn')}
              </button>
            </div>
          ) : (
            <div className="auth-footer">
              {t(register ? 'haveAccount' : 'needAccount')}{' '}
              <button
                className="text-link"
                disabled={busy}
                onClick={() => {
                  setRegister(!register);
                  setError(null);
                  setPassword('');
                  setShow(false);
                }}
              >
                {t(register ? 'signIn' : 'register')}
              </button>
            </div>
          )}
          {!requesting && !recovering && (
            <>
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
            </>
          )}
        </div>
      </section>
    </main>
  );
}

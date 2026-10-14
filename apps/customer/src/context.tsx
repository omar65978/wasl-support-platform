import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  AuthController,
  Repository,
  errorKey,
  getLanguage,
  setLanguage,
  translate,
  type Language,
  type TranslationKey,
} from '@wasl/shared';
export const auth = new AuthController('customer');
export const api = new Repository(auth);
const Context = createContext<null | {
  lang: Language;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
  notify: (key: TranslationKey) => void;
}>(null);
export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, updateLanguage] = useState(getLanguage);
  const [toast, setToast] = useState<TranslationKey | null>(null);
  useEffect(() => {
    setLanguage(lang);
  }, [lang]);
  useEffect(() => {
    let stop: (() => void) | undefined;
    let cancelled = false;
    auth.init().then((fn) => {
      if (cancelled) fn();
      else stop = fn;
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);
  const t = useCallback((key: TranslationKey) => translate(lang, key), [lang]);
  return (
    <Context.Provider
      value={{
        lang,
        t,
        toggleLanguage: () => updateLanguage(lang === 'en' ? 'ar' : 'en'),
        notify: setToast,
      }}
    >
      {children}
      {toast && (
        <div className="alert alert-success toast" role="status">
          {t(toast)}
          <button
            className="btn btn-quiet btn-small"
            aria-label={t('close')}
            onClick={() => setToast(null)}
          >
            ×
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
export function useApp() {
  return useContext(Context)!;
}
export function useAuth() {
  return useSyncExternalStore(auth.subscribe, auth.getSnapshot);
}
export function useResource<T>(loader: () => Promise<T>, poll = true) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const generation = useRef(0);
  const active = useRef(true);
  const busy = useRef(false);
  const refresh = useCallback(async () => {
    const id = ++generation.current;
    busy.current = true;
    try {
      const value = await loader();
      if (active.current && id === generation.current) {
        setData(value);
        setError(null);
      }
    } catch (e) {
      if (active.current && id === generation.current) setError(e);
    } finally {
      if (active.current && id === generation.current) {
        setLoading(false);
        busy.current = false;
      }
    }
  }, [loader]);
  useEffect(() => {
    active.current = true;
    setLoading(true);
    setData(null);
    refresh();
    const timer = poll
      ? setInterval(() => {
          if (!document.hidden && !busy.current) refresh();
        }, 15000)
      : undefined;
    const focus = () => {
      if (!busy.current) refresh();
    };
    window.addEventListener('focus', focus);
    return () => {
      active.current = false;
      generation.current++;
      clearInterval(timer);
      window.removeEventListener('focus', focus);
    };
  }, [refresh, poll]);
  return { data, loading, error, refresh };
}
export function useDebounce(value: string, delay = 350) {
  const [result, setResult] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setResult(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return result;
}
export function ErrorNotice({ error, retry }: { error: unknown; retry?: () => void }) {
  const { t } = useApp();
  if (!error) return null;
  return (
    <div className="alert alert-error" role="alert">
      <span className="grow">{t(errorKey(error))}</span>
      {retry && (
        <button className="btn btn-small btn-secondary" onClick={retry}>
          {t('retry')}
        </button>
      )}
    </div>
  );
}
export function Loading() {
  const { t } = useApp();
  return (
    <div className="loading" role="status">
      <span className="spinner" />
      {t('loading')}
    </div>
  );
}

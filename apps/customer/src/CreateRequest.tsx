import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, LockKeyhole, Send } from 'lucide-react';
import { CATEGORIES, URGENCIES, type NewRequest } from '@wasl/shared';
import { api, ErrorNotice, useApp } from './context';
export function CreateRequest() {
  const { t, lang, notify } = useApp();
  const navigate = useNavigate();
  const [input, setInput] = useState<NewRequest>({
    title: '',
    description: '',
    category: 'technical',
    urgency: 'normal',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const id = await api.create(input);
      notify('createdSuccess');
      navigate(`/requests/${id}`);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="customer-create">
      <Link to="/" className="btn btn-quiet btn-small">
        {lang === 'ar' ? <ArrowRight size={15} /> : <ArrowLeft size={15} />} {t('back')}
      </Link>
      <div className="section-heading">
        <h1>{t('createTitle')}</h1>
        <p>{t('createBody')}</p>
      </div>
      <div className="panel create-panel">
        <ErrorNotice error={error} />
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="title">{t('title')}</label>
            <input
              id="title"
              value={input.title}
              onChange={(e) => setInput({ ...input, title: e.target.value })}
              placeholder={t('titlePlaceholder')}
              required
              minLength={5}
              maxLength={140}
            />
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="category">{t('category')}</label>
              <select
                id="category"
                value={input.category}
                onChange={(e) =>
                  setInput({ ...input, category: e.target.value as NewRequest['category'] })
                }
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t(c)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="urgency">{t('urgency')}</label>
              <select
                id="urgency"
                value={input.urgency}
                onChange={(e) =>
                  setInput({ ...input, urgency: e.target.value as NewRequest['urgency'] })
                }
              >
                {URGENCIES.map((u) => (
                  <option key={u} value={u}>
                    {t(u)}
                  </option>
                ))}
              </select>
              <small>{t('urgencyHelp')}</small>
            </div>
          </div>
          <div className="field">
            <label htmlFor="description">{t('description')}</label>
            <textarea
              id="description"
              style={{ minHeight: 200 }}
              value={input.description}
              onChange={(e) => setInput({ ...input, description: e.target.value })}
              placeholder={t('descriptionPlaceholder')}
              minLength={20}
              maxLength={10000}
              required
              aria-describedby="description-help"
            />
            <small id="description-help">{t('descriptionHelp')}</small>
          </div>
          <div className="form-actions">
            <Link className="btn btn-secondary" to="/">
              {t('cancel')}
            </Link>
            <button className="btn btn-primary" disabled={busy}>
              <Send size={15} />
              {t(busy ? 'saving' : 'submit')}
            </button>
          </div>
        </form>
      </div>
      <p className="create-note">
        <LockKeyhole size={14} />
        {t('privacyBody')}
      </p>
    </section>
  );
}

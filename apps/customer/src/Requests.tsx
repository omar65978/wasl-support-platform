import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  CreditCard,
  Globe2,
  Inbox,
  MessageSquare,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserRound,
} from 'lucide-react';
import {
  CATEGORIES,
  PAGE_SIZE,
  URGENCIES,
  defaultFilters,
  formatDate,
  type Category,
  type RequestFilters,
} from '@wasl/shared';
import { api, ErrorNotice, Loading, useApp, useAuth, useDebounce, useResource } from './context';
const categoryIcons = {
  billing: CreditCard,
  technical: Globe2,
  account: UserRound,
  general: MessageSquare,
};
export function CategoryIcon({ category }: { category: Category }) {
  const Icon = categoryIcons[category];
  return (
    <span className={`request-symbol symbol-${category}`}>
      <Icon size={17} strokeWidth={1.6} />
    </span>
  );
}
export function RequestsPage() {
  const { t, lang } = useApp();
  const { profile } = useAuth();
  const dialog = useRef<HTMLDialogElement>(null);
  const [filters, setFilters] = useState<RequestFilters>(defaultFilters);
  const [search, setSearch] = useState('');
  const query = useDebounce(search);
  const [expanded, setExpanded] = useState(false);
  const change = (values: Partial<RequestFilters>) =>
    setFilters((f) => ({ ...f, ...values, page: 1 }));
  const load = useCallback(async () => {
    const [page, summary] = await Promise.all([
      api.list({ ...filters, search: query }),
      api.summary(),
    ]);
    return { ...page, summary };
  }, [filters, query]);
  const { data, loading, error, refresh } = useResource(load);
  const tabs: {
    key: RequestFilters['status'];
    label: 'all' | 'active' | 'waiting' | 'completed';
    count: number;
  }[] = [
    { key: 'all', label: 'all', count: data?.summary.total || 0 },
    { key: 'active', label: 'active', count: data?.summary.active || 0 },
    { key: 'waiting_customer', label: 'waiting', count: data?.summary.waiting || 0 },
    { key: 'resolved', label: 'completed', count: data?.summary.resolved || 0 },
  ];
  const pages = Math.max(1, Math.ceil((data?.total || 0) / PAGE_SIZE));
  return (
    <>
      <div className="greeting">
        <span>
          {t('hello')}, {profile!.full_name.split(' ')[0]} <span aria-hidden="true">☀</span>
        </span>
        <time>
          {new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          }).format(new Date())}
        </time>
      </div>
      <section className="customer-hero">
        <div>
          <h1>{t('customerHero')}</h1>
          <p>{t('customerHeroBody')}</p>
          <Link className="btn btn-white" to="/new">
            <Plus size={16} />
            {t('newRequest')}
          </Link>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="hero-orbit" />
          <div className="hero-ticket">
            <div className="hero-ticket-header">
              <span>Wasl / وصل</span>
              <span>WS–1041</span>
            </div>
            <h3>{t('heroNote')}</h3>
            {(['heroTracking', 'heroOwnership', 'heroResolution'] as const).map((text, i) => (
              <div className="hero-ticket-row" key={text}>
                <span className="hero-check">
                  {i === 2 ? <MessageSquare size={11} /> : <Check size={12} />}
                </span>
                {t(text)}
              </div>
            ))}
          </div>
          <div className="hero-float">
            <Sparkles size={24} strokeWidth={1.5} />
          </div>
        </div>
      </section>
      <div className="customer-content">
        <section>
          <div className="between section-heading">
            <div>
              <h2>{t('yourRequests')}</h2>
              <p>{t('listSubtitle')}</p>
            </div>
            <span className="live-label">
              <span className="online-dot" />
              {t('live')}
            </span>
          </div>
          <ErrorNotice error={error} retry={refresh} />
          <div className="panel customer-list">
            <div className="tabs" aria-label={t('status')}>
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  className={`tab ${filters.status === tab.key ? 'active' : ''}`}
                  aria-pressed={filters.status === tab.key}
                  onClick={() => change({ status: tab.key })}
                >
                  {t(tab.label)}
                  <span className="tab-count">{tab.count}</span>
                </button>
              ))}
            </div>
            <div className="toolbar">
              <label className="search-box">
                <Search size={16} />
                <span className="sr-only">{t('search')}</span>
                <input
                  value={search}
                  maxLength={200}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    change({});
                  }}
                  placeholder={t('searchPlaceholder')}
                />
              </label>
              <select
                aria-label={t('sort')}
                value={filters.sort}
                onChange={(e) => change({ sort: e.target.value as RequestFilters['sort'] })}
              >
                <option value="updated">{t('updated')}</option>
                <option value="oldest">{t('oldest')}</option>
                <option value="urgency">{t('urgencySort')}</option>
              </select>
              <button
                className="icon-btn"
                aria-expanded={expanded}
                aria-label={t('filter')}
                onClick={() => setExpanded(!expanded)}
              >
                <SlidersHorizontal size={15} />
              </button>
            </div>
            {expanded && (
              <div className="filters-row">
                <label>
                  {t('category')}
                  <select
                    value={filters.category}
                    onChange={(e) =>
                      change({ category: e.target.value as RequestFilters['category'] })
                    }
                  >
                    <option value="all">{t('allCategories')}</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {t(c)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {t('urgency')}
                  <select
                    value={filters.urgency}
                    onChange={(e) =>
                      change({ urgency: e.target.value as RequestFilters['urgency'] })
                    }
                  >
                    <option value="all">{t('allUrgencies')}</option>
                    {URGENCIES.map((c) => (
                      <option key={c} value={c}>
                        {t(c)}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="text-link"
                  onClick={() => {
                    setFilters(defaultFilters());
                    setSearch('');
                  }}
                >
                  {t('clearFilters')}
                </button>
              </div>
            )}
            {loading ? (
              <Loading />
            ) : data?.items.length ? (
              <>
                <div className="table-wrap">
                  <table className="request-table">
                    <thead>
                      <tr>
                        <th>{t('request')}</th>
                        <th>{t('status')}</th>
                        <th className="customer-table-desktop-date">{t('updatedAt')}</th>
                        <th aria-label={t('viewRequest')} className="chevron-cell" />
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <div className="flex">
                              <CategoryIcon category={r.category} />
                              <div>
                                <Link className="request-title" to={`/requests/${r.id}`}>
                                  {r.title}
                                </Link>
                                <div className="request-sub">
                                  <span dir="ltr">{r.reference}</span>
                                  <span>{t(r.category)}</span>
                                  <span className={`urgency urgency-${r.urgency}`}>
                                    {t(r.urgency)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`pill status-${r.status}`}>
                              {t(r.status === 'waiting_customer' ? 'waiting' : r.status)}
                            </span>
                          </td>
                          <td className="customer-table-desktop-date muted small">
                            {formatDate(r.updated_at, lang)}
                          </td>
                          <td className="chevron-cell">
                            <Link
                              to={`/requests/${r.id}`}
                              aria-label={`${t('viewRequest')} ${r.reference}`}
                              className="muted"
                            >
                              {lang === 'ar' ? (
                                <ChevronLeft size={16} />
                              ) : (
                                <ChevronRight size={16} />
                              )}
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="pagination">
                  <span>
                    {data.total} {t('results')}
                  </span>
                  <div className="flex">
                    <button
                      className="btn btn-secondary btn-small"
                      disabled={filters.page <= 1}
                      onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                    >
                      {t('previous')}
                    </button>
                    <span className="page-number">{filters.page}</span>
                    <span>
                      {t('of')} {pages}
                    </span>
                    <button
                      className="btn btn-secondary btn-small"
                      disabled={filters.page >= pages}
                      onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                    >
                      {t('next')}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty">
                <span className="empty-icon">
                  <Inbox size={27} strokeWidth={1.5} />
                </span>
                <h3>{t(data?.summary.total ? 'noResults' : 'noRequests')}</h3>
                <p>{t(data?.summary.total ? 'noResultsBody' : 'noRequestsBody')}</p>
                {data?.summary.total ? (
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setFilters(defaultFilters());
                      setSearch('');
                    }}
                  >
                    {t('clearFilters')}
                  </button>
                ) : (
                  <Link to="/new" className="btn btn-primary">
                    {t('newRequest')}
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>
        <aside className="customer-aside">
          <div className="help-card">
            <span className="help-icon">
              <CircleHelp size={23} strokeWidth={1.6} />
            </span>
            <h3>{t('helpTitle')}</h3>
            <p>{t('helpBody')}</p>
            <button className="text-link" onClick={() => dialog.current?.showModal()}>
              {t('helpLink')}
              <ArrowUpRight size={13} />
            </button>
          </div>
          <div className="privacy-card">
            <ShieldCheck size={22} strokeWidth={1.5} />
            <div>
              <h3>{t('privacy')}</h3>
              <p>{t('privacyBody')}</p>
            </div>
          </div>
        </aside>
      </div>
      <dialog ref={dialog} className="help-dialog">
        <CircleHelp size={25} />
        <h2>{t('helpHeading')}</h2>
        <ol>
          <li>{t('helpStep1')}</li>
          <li>{t('helpStep2')}</li>
          <li>{t('helpStep3')}</li>
        </ol>
        <button className="btn btn-primary" onClick={() => dialog.current?.close()}>
          {t('close')}
        </button>
      </dialog>
    </>
  );
}

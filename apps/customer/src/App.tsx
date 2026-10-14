import { useState } from 'react';
import { HashRouter, Link, Route, Routes } from 'react-router-dom';
import { Globe2, LayoutList, LogOut, ShieldCheck } from 'lucide-react';
import { applicationUrl, initials } from '@wasl/shared';
import { AppProvider, auth, ErrorNotice, Loading, useApp, useAuth } from './context';
import { AuthPage, Brand } from './Auth';
import { RequestsPage } from './Requests';
import { CreateRequest } from './CreateRequest';
import { RequestDetail } from './RequestDetail';
function Shell() {
  const { t,toggleLanguage } = useApp();const { profile,loading,demo,error } = useAuth();const [logoutError,setLogoutError] = useState<unknown>(null);
  async function signOut(){try{await auth.signOut();}catch(e){setLogoutError(e);}}
  if(loading)return <div className="full-center"><Brand/><Loading/><p>{t('loginPending')}</p></div>;
  if(!profile)return <AuthPage/>;
  if(profile.role!=='customer')return <div className="full-center"><Brand/><h1>{t('wrongRole')}</h1><p>{t('wrongRoleBody')}</p><a href={applicationUrl('support')} className="btn btn-primary">{t('openWorkspace')}</a><button className="btn btn-secondary" onClick={signOut}>{t('signOut')}</button><ErrorNotice error={logoutError}/></div>;
  return <><a href="#main" className="skip-link" onClick={e=>{e.preventDefault();document.getElementById('main')?.focus();}}>{t('requests')}</a>{demo&&<div className="demo-banner"><span>{t('demoNotice')}</span><a href={applicationUrl('support')}>{t('supportWorkspace')} ↗</a></div>}<header className="customer-header"><div className="header-inner"><Link to="/" aria-label={t('brand')}><Brand/></Link><span className="brand-sub">{t('customerPortal')}</span><nav className="customer-nav"><Link to="/"><LayoutList size={16}/>{t('requests')}</Link></nav><div className="header-controls"><button className="btn btn-quiet btn-small" onClick={toggleLanguage} aria-label={t('switchLanguage')}><Globe2 size={15}/>{t('language')}</button><div className="identity"><span className="avatar">{initials(profile.full_name)}</span><div><strong>{profile.full_name}</strong><small>{t('customer')}</small></div></div><button className="btn btn-quiet btn-small" onClick={signOut} aria-label={t('signOut')}><LogOut size={17}/></button></div></div></header><main className="customer-main" id="main" tabIndex={-1}><ErrorNotice error={logoutError||error}/><Routes><Route path="/" element={<RequestsPage/>}/><Route path="/new" element={<CreateRequest/>}/><Route path="/requests/:id" element={<RequestDetail/>}/><Route path="*" element={<div className="empty"><h2>{t('notFound')}</h2><Link to="/" className="btn btn-primary">{t('back')}</Link></div>}/></Routes><footer className="footer"><span>© {new Date().getFullYear()} {t('brand')}. {t('footer')}</span><span className="flex"><ShieldCheck size={13}/>{t(demo?'demoMode':'connected')}</span></footer></main></>;
}
export function App(){return <AppProvider><HashRouter><Shell/></HashRouter></AppProvider>;}

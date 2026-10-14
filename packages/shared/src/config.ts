export const config = {
  supabaseUrl: 'https://iaukydzbcdmglqajllei.supabase.co',
  supabasePublishableKey: 'sb_publishable_AqWrf6GufnWU-Esd3MkLvQ_xoGFCUlL'
};
export function applicationUrl(app: 'customer' | 'support') {
  const port = window.location.port;
  if (port === '5173' || port === '4200') return `${window.location.protocol}//${window.location.hostname}:${app === 'customer' ? '5173' : '4200'}/${app}/`;
  return `/${app}/`;
}

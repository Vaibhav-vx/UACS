import { useState, useEffect, useMemo } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function ExpiryTimer({ expiresAt, status }) {
  const [now, setNow] = useState(Date.now());
  const { t } = useLanguage();

  useEffect(() => { if (status === 'expired') return; const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, [status]);

  const { label, urgency, expired } = useMemo(() => {
    if (status === 'expired') return { label: t('expired2'), urgency: 'expired', expired: true };
    if (!expiresAt) return { label: t('noExpiry'), urgency: 'none', expired: false };
    const diff = new Date(expiresAt).getTime() - now;
    if (diff <= 0) return { label: t('expired2'), urgency: 'expired', expired: true };
    const h = Math.floor(diff / 3600000); const m = Math.floor((diff % 3600000) / 60000); const s = Math.floor((diff % 60000) / 1000);
    let urg = 'normal'; if (diff < 300000) urg = 'critical'; else if (diff < 1800000) urg = 'warning'; else if (diff < 3600000) urg = 'soon';
    return { label: `${h > 0 ? `${h}${t('hours').charAt(0)} ` : ''}${m}${t('minutes').charAt(0)} ${s}${t('seconds').charAt(0)}`, urgency: urg, expired: false };
  }, [expiresAt, now, status, t]);

  const styles = { none: { bg: 'var(--bg-hover)', color: 'var(--text-muted)', border: 'var(--border)' }, normal: { bg: 'rgba(34,197,94,0.1)', color: '#22c55e', border: 'rgba(34,197,94,0.2)' }, soon: { bg: 'rgba(234,179,8,0.1)', color: '#facc15', border: 'rgba(234,179,8,0.2)' }, warning: { bg: 'rgba(249,115,22,0.1)', color: '#fb923c', border: 'rgba(249,115,22,0.2)' }, critical: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.2)' }, expired: { bg: 'var(--bg-hover)', color: 'var(--text-muted)', border: 'var(--border)' } };
  const st = styles[urgency] || styles.none;
  return (<div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-mono font-medium ${urgency === 'critical' && !expired ? 'pulse-critical' : ''}`} style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{urgency === 'critical' && !expired ? <AlertTriangle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}{label}</div>);
}

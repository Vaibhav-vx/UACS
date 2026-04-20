import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Clock, AlertTriangle, CheckCircle, Send, Timer, RefreshCw, Eye, RotateCcw, Zap, TrendingUp, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { messagesApi } from '../api';
import { useLanguage } from '../i18n/LanguageContext';
import ExpiryTimer from '../components/ExpiryTimer';
import ChannelBadge from '../components/ChannelBadge';
import AlertBanner from '../components/AlertBanner';

export default function DashboardPage() {
  const [activeMessages, setActiveMessages]   = useState([]);
  const [expiredMessages, setExpiredMessages]  = useState([]);
  const [draftMessages, setDraftMessages]      = useState([]);
  const [stats, setStats]      = useState({ totalToday: 0, active: 0, expiringSoon: 0, expired: 0 });
  const [activeTab, setActiveTab]              = useState('active');
  const [loading, setLoading]                  = useState(true);
  const [actionLoading, setActionLoading]      = useState({});
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [emergencyText, setEmergencyText] = useState('');
  const [emergencyZone, setEmergencyZone] = useState('');
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [emergencyError, setEmergencyError] = useState('');
  const navigate = useNavigate();
  const { t } = useLanguage();

  const fetchData = useCallback(async () => {
    try {
      const [a, e, d, s] = await Promise.all([
        messagesApi.getAll('active'),
        messagesApi.getAll('expired'),
        messagesApi.getAll('draft'),
        messagesApi.getStats(),
      ]);
      setActiveMessages(a.data);
      setExpiredMessages(e.data);
      setDraftMessages(d.data);
      setStats(s.data);
    } catch {
      toast.error(t('failedFetch') || 'Failed to load data — is the backend running?');
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchData(); const iv = setInterval(fetchData, 30000); return () => clearInterval(iv); }, [fetchData]);

  const handleExpireNow = async (id) => {
    setActionLoading(p => ({ ...p, [`e-${id}`]: true }));
    try { await messagesApi.expire(id); toast.success(t('messageExpired') || 'Message expired'); fetchData(); }
    catch { toast.error(t('failedExpire') || 'Failed to expire'); } finally { setActionLoading(p => ({ ...p, [`e-${id}`]: false })); }
  };
  const handleExtend = async (id) => {
    setActionLoading(p => ({ ...p, [`x-${id}`]: true }));
    try { await messagesApi.extend(id, new Date(Date.now() + 86400000).toISOString()); toast.success(t('extendedBy24') || 'Extended by 24h'); fetchData(); }
    catch { toast.error(t('failedExtend') || 'Failed to extend'); } finally { setActionLoading(p => ({ ...p, [`x-${id}`]: false })); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this message? This cannot be undone.')) return;
    setActionLoading(p => ({ ...p, [`d-${id}`]: true }));
    try { await messagesApi.delete(id); toast.success('Message deleted'); fetchData(); }
    catch { toast.error('Failed to delete message'); } finally { setActionLoading(p => ({ ...p, [`d-${id}`]: false })); }
  };

  const handleEmergencySubmit = async () => {
    if (!emergencyText.trim() || !emergencyZone.trim()) {
      setEmergencyError('Both message and target zone are required');
      return;
    }
    setEmergencyError('');
    setEmergencyLoading(true);
    try {
      await messagesApi.emergency({ master_content: emergencyText, target_zone: emergencyZone });
      setIsEmergencyModalOpen(false);
      setEmergencyText('');
      setEmergencyZone('');
      toast.success(t('emergencySent') || '🚨 Emergency broadcast sent to all channels', {
        style: { background: '#ef4444', color: '#fff' },
        iconTheme: { primary: '#fff', secondary: '#ef4444' }
      });
      fetchData();
    } catch (err) {
      setEmergencyError(err.response?.data?.error || err.message);
    } finally {
      setEmergencyLoading(false);
    }
  };

  const statCards = [
    { label: t('totalSentToday'), value: stats.totalToday, icon: Send, color: 'var(--accent)' },
    { label: t('activeAlerts'), value: stats.active, icon: Activity, color: '#22c55e' },
    { label: t('expiringSoon'), value: stats.expiringSoon, icon: AlertTriangle, color: '#eab308' },
    { label: t('expiredLabel'), value: stats.expired, icon: CheckCircle, color: 'var(--text-muted)' },
  ];

  if (loading) return (<div className="space-y-6"><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i=><div key={i} className="glass-card p-5 h-24 shimmer rounded-xl"/>)}</div><div className="space-y-3">{[1,2,3].map(i=><div key={i} className="glass-card p-6 h-32 shimmer rounded-xl"/>)}</div></div>);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-3"><TrendingUp className="w-6 h-6" style={{ color: 'var(--accent)' }} />{t('dashboardTitle')}</h1><p className="text-sm mt-1 text-theme-muted">{t('dashboardSubtitle')}</p></div>
        <button onClick={fetchData} className="btn-secondary text-sm"><RefreshCw className="w-4 h-4" /> {t('refresh')}</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s,i)=>(<div key={i} className="stat-card animate-slide-up" style={{ animationDelay: `${i*80}ms` }}><div className="flex items-center justify-between"><span className="text-xs uppercase tracking-wider font-medium text-theme-muted">{s.label}</span><s.icon className="w-4 h-4" style={{ color: s.color }} /></div><span className="text-3xl font-bold tracking-tight">{s.value}</span></div>))}
      </div>
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        {[
          { key: 'active',  icon: Zap,      label: `${t('activeAlerts') || 'Active'} (${activeMessages.length})` },
          { key: 'drafts',  icon: PenSquare, label: `Drafts (${draftMessages.length})` },
          { key: 'expired', icon: Clock,    label: `${t('expiredAlerts') || 'Expired'} (${expiredMessages.length})` },
        ].map(tb => (
          <button key={tb.key} onClick={() => setActiveTab(tb.key)} className="px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2" style={{ background: activeTab===tb.key?'var(--accent)':'transparent', color: activeTab===tb.key?'white':'var(--text-muted)', boxShadow: activeTab===tb.key?'var(--shadow-md)':'none', border: 'none', cursor: 'pointer' }}><tb.icon className="w-3.5 h-3.5"/>{tb.label}</button>
        ))}
      </div>
      {activeTab==='active' && (<div className="space-y-3">
        {activeMessages.length===0 ? (<div className="glass-card p-12 text-center"><Activity className="w-12 h-12 mx-auto mb-4 text-theme-dim" /><h3 className="text-lg font-medium text-theme-secondary mb-2">{t('noActiveAlerts')}</h3><p className="text-sm text-theme-muted mb-4">{t('noActiveDesc')}</p><button onClick={()=>navigate('/compose')} className="btn-primary text-sm"><Send className="w-4 h-4" /> {t('composeMessage')}</button></div>
        ) : activeMessages.map((msg,i)=>(
          <div key={msg.id} className="glass-card p-5 animate-slide-up" style={{ animationDelay:`${i*60}ms` }}>
            <div className="flex flex-col lg:flex-row lg:items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap"><AlertBanner urgency={msg.urgency} /><h3 className="font-semibold text-lg">{msg.title}</h3></div>
                <p className="text-sm text-theme-secondary mb-3 line-clamp-2">{msg.master_content}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-theme-muted"><div className="flex items-center gap-1.5">{(msg.channels||[]).map(ch=><ChannelBadge key={ch} channel={ch}/>)}</div><span style={{color:'var(--border-strong)'}}>•</span><span>{(msg.languages||[]).length} {t('languageCount') || 'language(s)'}</span><span style={{color:'var(--border-strong)'}}>•</span><span>{t('by')} {msg.sent_by}</span></div>
              </div>
              <div className="flex flex-col items-end gap-3 shrink-0">
                {msg.expires_at && <ExpiryTimer expiresAt={msg.expires_at} status={msg.status}/>}
                <div className="flex items-center gap-2">
                  <button onClick={()=>handleExtend(msg.id)} disabled={actionLoading[`x-${msg.id}`]} className="btn-secondary text-xs py-1.5 px-3">{actionLoading[`x-${msg.id}`]?<RefreshCw className="w-3 h-3 animate-spin"/>:<Timer className="w-3 h-3"/>} {t('extend')}</button>
                  <button onClick={()=>handleExpireNow(msg.id)} disabled={actionLoading[`e-${msg.id}`]} className="btn-danger text-xs py-1.5 px-3">{actionLoading[`e-${msg.id}`]?<RefreshCw className="w-3 h-3 animate-spin"/>:<AlertTriangle className="w-3 h-3"/>} {t('expireNow')}</button>
                  <button onClick={()=>handleDelete(msg.id)} disabled={actionLoading[`d-${msg.id}`]} className="btn-secondary text-xs py-1.5 px-3" style={{color:'#ef4444',borderColor:'rgba(239,68,68,0.3)'}}>{actionLoading[`d-${msg.id}`]?<RefreshCw className="w-3 h-3 animate-spin"/>:<X className="w-3 h-3"/>}</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>)}
      {activeTab==='drafts' && (<div className="space-y-3">
        {draftMessages.length===0 ? (<div className="glass-card p-12 text-center"><PenSquare className="w-12 h-12 mx-auto mb-4 text-theme-dim" /><h3 className="text-lg font-medium text-theme-secondary mb-2">No Draft Messages</h3><p className="text-sm text-theme-muted mb-4">Saved drafts will appear here</p><button onClick={()=>navigate('/compose')} className="btn-primary text-sm"><Send className="w-4 h-4" /> Compose</button></div>
        ) : draftMessages.map((msg,i)=>(
          <div key={msg.id} className="glass-card p-5 animate-slide-up" style={{ animationDelay:`${i*60}ms`, borderLeft: '3px solid var(--accent)' }}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap"><AlertBanner urgency={msg.urgency} /><h3 className="font-semibold">{msg.title}</h3></div>
                <p className="text-sm text-theme-muted line-clamp-1">{msg.master_content}</p>
                <p className="text-xs text-theme-dim mt-1">{t('by')} {msg.sent_by} · {new Date(msg.created_at||Date.now()).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={()=>navigate('/compose')} className="btn-secondary text-xs py-1.5 px-3"><PenSquare className="w-3 h-3"/> Edit</button>
                <button onClick={()=>navigate(`/approval/${msg.id}`)} className="btn-primary text-xs py-1.5 px-3"><Send className="w-3 h-3"/> Send</button>
                <button onClick={()=>handleDelete(msg.id)} disabled={actionLoading[`d-${msg.id}`]} className="btn-secondary text-xs py-1.5 px-3" style={{color:'#ef4444',borderColor:'rgba(239,68,68,0.3)'}}>{actionLoading[`d-${msg.id}`]?<RefreshCw className="w-3 h-3 animate-spin"/>:<X className="w-3 h-3"/>}</button>
              </div>
            </div>
          </div>
        ))}
      </div>)}
      {activeTab==='expired' && (<div className="space-y-3">
        {expiredMessages.length===0 ? (<div className="glass-card p-12 text-center"><Clock className="w-12 h-12 mx-auto mb-4 text-theme-dim" /><h3 className="text-lg font-medium text-theme-secondary mb-2">{t('noExpiredAlerts')}</h3><p className="text-sm text-theme-muted">{t('noExpiredDesc')}</p></div>
        ) : expiredMessages.map((msg,i)=>(
          <div key={msg.id} className="glass-card p-5 opacity-75 animate-slide-up" style={{ animationDelay:`${i*60}ms` }}>
            <div className="flex flex-col lg:flex-row lg:items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap"><span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider" style={{ background:'var(--bg-hover)',color:'var(--text-muted)',border:'1px solid var(--border)'}}>{t('expired')}</span><h3 className="font-semibold">{msg.title}</h3></div>
                <p className="text-sm text-theme-muted mb-2 line-clamp-1">{msg.master_content}</p>
                <div className="flex items-center gap-3 text-xs text-theme-dim"><span>{t('expired')}: {msg.expires_at ? new Date(msg.expires_at).toLocaleString() : t('manual')}</span></div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={()=>navigate(`/approval/${msg.id}`)} className="btn-secondary text-xs py-1.5 px-3"><RotateCcw className="w-3 h-3"/> {t('resend')}</button>
                <button onClick={()=>navigate(`/approval/${msg.id}`)} className="btn-secondary text-xs py-1.5 px-3"><Eye className="w-3 h-3"/> {t('view')}</button>
              </div>
            </div>
          </div>
        ))}
      </div>)}

      {/* Floating Emergency Button */}
      <div 
        className="fixed bottom-8 right-8 z-[9999] flex flex-col items-center gap-2 cursor-pointer group"
        onClick={() => setIsEmergencyModalOpen(true)}
      >
        <button 
          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl transition-transform group-hover:scale-110 emergency-btn-pulse"
          style={{ 
            background: '#ef4444', 
            border: 'none',
            color: 'white'
          }}
        >
          ⚠️
        </button>
        <span className="text-xs font-bold text-red-500 uppercase tracking-widest drop-shadow-md">
          {t('emergency') || 'Emergency'}
        </span>
      </div>

      {/* Emergency Modal */}
      {isEmergencyModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card max-w-lg w-full bg-[var(--bg-base)] border border-red-500/30 overflow-hidden shadow-2xl flex flex-col">
            
            <div className="p-6 border-b border-[var(--border)] bg-red-500/10 relative">
              <button 
                onClick={() => setIsEmergencyModalOpen(false)}
                className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-bold text-red-500 flex items-center gap-2">
                {t('emergencyBroadcast') || '⚠️ Emergency Broadcast'}
              </h2>
              <p className="text-sm text-red-400 mt-1">
                {t('emergencySubtitle') || 'Dispatches to ALL channels in ALL languages instantly'}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {emergencyError && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-500 text-sm">
                  {emergencyError}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[var(--text-secondary)]">  
                   {t('emergencyMessage') || 'Emergency Message'} <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="textarea-field w-full h-32"
                  placeholder={t('emergencyPlaceholder') || "Describe the emergency situation clearly and briefly..."}
                  value={emergencyText}
                  onChange={e => setEmergencyText(e.target.value)}
                  maxLength={300}
                />
                <div className="text-right text-xs mt-1 text-[var(--text-muted)]">
                  {emergencyText.length}/300
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-[var(--text-secondary)]">
                  {t('targetZone') || 'Target Zone'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input-field w-full"
                  placeholder={t('zonePlaceholder') || "e.g. Zone 4, Mumbai"}
                  value={emergencyZone}
                  onChange={e => setEmergencyZone(e.target.value)}
                />
              </div>

              <div className="p-4 bg-[var(--bg-hover)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-muted)] space-y-1 mt-2">
                <p><strong>{t('autoFilledSettings') || 'Auto-filled settings'}:</strong></p>
                <p>• {t('urgencyLevel') || 'Urgency'}: <span className="text-red-500">{t('critical')}</span></p>
                <p>• {t('selectChannels') || 'Channels'}: {t('allChannelsLabel') || 'All (SMS, Twitter, Radio, TV, Website)'}</p>
                <p>• {t('selectLanguages') || 'Languages'}: {t('allLanguagesLabel') || 'All Supported (Hi, Mr, Ta, Te, En)'}</p>
                <p>• {t('expiresIn') || 'Expires in'}: 6 {t('hours')}</p>
              </div>
            </div>

            <div className="p-6 border-t border-[var(--border)] bg-[var(--bg-surface)] flex flex-col gap-3">
              <button 
                onClick={handleEmergencySubmit}
                disabled={emergencyLoading}
                className="w-full py-3 rounded-lg font-bold text-white uppercase tracking-wider text-sm transition-all"
                style={{ background: emergencyLoading ? '#991b1b' : '#ef4444' }}
              >
                {emergencyLoading ? <RefreshCw className="w-5 h-5 mx-auto animate-spin" /> : (t('sendEmergency') || 'SEND EMERGENCY BROADCAST')}
              </button>
              
              <button 
                onClick={() => setIsEmergencyModalOpen(false)}
                disabled={emergencyLoading}
                className="w-full py-2 rounded-lg font-medium text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors"
              >
                {t('cancel') || 'Cancel'}
              </button>
              
              <p className="text-xs text-center text-red-500 font-medium">
                {t('emergencyWarning') || '⚠️ This will immediately broadcast to all channels. This action cannot be undone.'}
              </p>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}

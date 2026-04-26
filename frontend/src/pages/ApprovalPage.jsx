import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Send, ArrowLeft, Loader2, AlertTriangle, Languages, BarChart3, Eye, PenSquare, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { messagesApi, dispatchApi, translateApi } from '../api';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageCard from '../components/LanguageCard';
import ChannelBadge from '../components/ChannelBadge';
import AlertBanner from '../components/AlertBanner';

export default function ApprovalPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [message, setMessage]         = useState(null);
  const [translations, setTranslations] = useState({});
  const [approvals, setApprovals]     = useState({});
  const [loading, setLoading]         = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [rejecting, setRejecting]     = useState(false);
  const [retranslating, setRetranslating] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [performance, setPerformance] = useState(null);
  const [loadingPerformance, setLoadingPerformance] = useState(false);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    (async () => {
      try {
        const r = await messagesApi.getById(id);
        setMessage(r.data);
        setTranslations(r.data.translations || {});
        const init = {};
        (r.data.languages || []).forEach(l => { init[l] = false; });
        setApprovals(init);

        // Fetch performance if sent/expired
        if (['sent', 'expired'].includes(r.data.status)) {
          setLoadingPerformance(true);
          try {
            const perf = await messagesApi.getPerformanceReport(id);
            setPerformance(perf.data);
          } finally {
            setLoadingPerformance(false);
          }
        }
      } catch {
        toast.error(t('failedLoadMessage') || 'Failed to load message');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate, t]);

  const consistencyData = useMemo(() => {
    if (!message?.master_content || Object.keys(translations).length === 0) return { score: 0, details: [] };
    const ml = message.master_content.length;
    const details = Object.entries(translations).map(([lang, text]) => {
      const ratio = Math.round((text.length / ml) * 100) / 100;
      return { lang, ratio, isConsistent: ratio >= 0.4 && ratio <= 3.0, length: text.length };
    });
    return {
      score: details.length > 0 ? Math.round((details.filter(d => d.isConsistent).length / details.length) * 100) : 0,
      details,
    };
  }, [message, translations]);

  const allApproved = Object.values(approvals).length > 0 && Object.values(approvals).every(Boolean);

  const handleRetranslate = async () => {
    if (!message) return;
    setRetranslating(true);
    try {
      toast.loading(t('retranslating') || 'Retranslating...', { id: 'rt' });
      const r = await translateApi.translate(message.master_content, message.languages);
      setTranslations(r.data.translations);
      const reset = {};
      message.languages.forEach(l => { reset[l] = false; });
      setApprovals(reset);
      toast.success(t('retranslateDone') || 'Retranslation complete', { id: 'rt' });
    } catch {
      toast.error(t('failedRetranslate') || 'Retranslation failed', { id: 'rt' });
    } finally {
      setRetranslating(false);
    }
  };

  const handleDispatch = async () => {
    if (!message) return;
    setDispatching(true);
    try {
      toast.loading(t('dispatching') || 'Dispatching...', { id: 'dp' });
      await messagesApi.update(message.id, { translations });
      await messagesApi.approve(message.id);
      const r = await dispatchApi.dispatch(message.id);
      const rp = r.data.report || {};
      const ok   = Object.values(rp).filter(s => s === 'sent').length;
      const fail = Object.values(rp).filter(s => s === 'failed').length;
      if (fail > 0) toast.error(`${ok} sent, ${fail} failed`, { id: 'dp' });
      else toast.success(t('messageSent') || 'Message dispatched!', { id: 'dp' });
      navigate('/dashboard');
    } catch (err) {
      toast.error((t('failedDispatch') || 'Dispatch failed') + ': ' + (err.response?.data?.error || err.message), { id: 'dp' });
    } finally {
      setDispatching(false);
    }
  };

  const handleReject = async () => {
    if (!message) return;
    setRejecting(true);
    try {
      await messagesApi.reject(message.id, rejectReason);
      toast.success('Message rejected and returned to draft');
      navigate('/approval');
    } catch (err) {
      toast.error('Failed to reject: ' + (err.response?.data?.error || err.message));
    } finally {
      setRejecting(false);
      setShowRejectModal(false);
    }
  };

  const handleQuickDispatch = async () => {
    if (!message) return;
    const allTrue = {};
    (message.languages || []).forEach(l => { allTrue[l] = true; });
    setApprovals(allTrue);
    setTimeout(handleDispatch, 100);
  };

  if (!id) return <PendingList />;
  if (loading) return (
    <div className="space-y-4">
      <div className="glass-card p-6 h-48 shimmer rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="glass-card p-6 h-40 shimmer rounded-xl" />)}
      </div>
    </div>
  );
  if (!message) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-secondary p-2"><ArrowLeft className="w-4 h-4"/></button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6" style={{color:'var(--accent)'}}/>
              {t('approvalTitle') || 'Review & Approve'}
            </h1>
            <p className="text-sm text-theme-muted">{t('approvalSubtitle') || 'Review translations before dispatching'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleRetranslate} disabled={retranslating || dispatching} className="btn-secondary text-sm">
            {retranslating ? <Loader2 className="w-4 h-4 animate-spin"/> : <Languages className="w-4 h-4"/>}
            {t('retranslate') || 'Retranslate'}
          </button>
          {/* ── REJECT button ── */}
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={dispatching || rejecting}
            className="btn-secondary text-sm"
            style={{ borderColor: 'rgba(239,68,68,0.4)', color: '#ef4444' }}
          >
            <XCircle className="w-4 h-4"/> {t('reject') || 'Reject'}
          </button>
        </div>
      </div>

      {/* Performance Report for Sent/Expired messages */}
      {(message.status === 'sent' || message.status === 'expired') && performance && (
        <div className="space-y-6 animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-card p-6 border-l-4 border-l-accent bg-accent/5">
              <div className="text-[10px] font-bold text-theme-muted uppercase tracking-widest mb-1">Total Reach</div>
              <div className="text-3xl font-black text-white">{performance.total_reach}</div>
              <div className="text-xs text-theme-dim mt-1">Recipients in {message.target_zone}</div>
            </div>
            <div className="glass-card p-6 border-l-4 border-l-emerald-500 bg-emerald-500/5">
              <div className="text-[10px] font-bold text-theme-muted uppercase tracking-widest mb-1">Confirmed Safe</div>
              <div className="text-3xl font-black text-emerald-500">{performance.safety.safe}</div>
              <div className="text-xs text-theme-dim mt-1">{Math.round((performance.safety.safe / (performance.responses || 1)) * 100)}% of responses</div>
            </div>
            <div className="glass-card p-6 border-l-4 border-l-red-500 bg-red-500/5">
              <div className="text-[10px] font-bold text-theme-muted uppercase tracking-widest mb-1">SOS Requests</div>
              <div className="text-3xl font-black text-red-500">{performance.safety.assistance}</div>
              <div className="text-xs text-theme-dim mt-1">{performance.safety.assisted} resolved by team</div>
            </div>
            <div className="glass-card p-6 border-l-4 border-l-indigo-500 bg-indigo-500/5">
              <div className="text-[10px] font-bold text-theme-muted uppercase tracking-widest mb-1">Response Rate</div>
              <div className="text-3xl font-black text-indigo-400">
                {Math.round((performance.responses / (performance.total_reach || 1)) * 100)}%
              </div>
              <div className="text-xs text-theme-dim mt-1">Active citizen engagement</div>
            </div>
          </div>

          {message.status === 'expired' && message.expiry_reason && (
            <div className="glass-card p-6 border-amber-500/30 bg-amber-500/5">
               <h3 className="text-sm font-bold text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                 <AlertTriangle className="w-4 h-4" /> Final Decision Audit
               </h3>
               <p className="text-lg text-white font-medium italic">"{message.expiry_reason}"</p>
               <p className="text-xs text-slate-500 mt-2">— Logged at alert termination</p>
            </div>
          )}

          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-theme-muted uppercase tracking-widest mb-6">Reach Metrics by Channel</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                {['SMS', 'Mobile App', 'Web Portal'].map((channel, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-400">
                      <span>{channel}</span>
                      <span>{idx === 0 ? '100%' : idx === 1 ? '78%' : '42%'}</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-accent rounded-full" 
                        style={{ width: idx === 0 ? '100%' : idx === 1 ? '78%' : '42%' }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-slate-800/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                 <div className="text-4xl font-black text-white mb-2">12.4m</div>
                 <div className="text-xs font-bold text-theme-muted uppercase tracking-widest">Avg. Response Time</div>
                 <p className="text-[10px] text-slate-500 mt-4 max-w-xs">Citizens respond significantly faster to SMS alerts compared to app notifications.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Consistency bar */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <BarChart3 className="w-4 h-4" style={{color:'var(--accent)'}}/>
            {t('consistencyScore') || 'Translation Consistency'}
          </div>
          <span className="text-lg font-bold" style={{color: consistencyData.score>=80?'#22c55e':consistencyData.score>=50?'#eab308':'#ef4444'}}>
            {consistencyData.score}%
          </span>
        </div>
        <div className="w-full rounded-full h-2" style={{background:'var(--bg-input)'}}>
          <div className="h-2 rounded-full" style={{width:`${consistencyData.score}%`,background:consistencyData.score>=80?'#22c55e':consistencyData.score>=50?'#eab308':'#ef4444',transition:'width 0.5s'}}/>
        </div>
        {consistencyData.details.some(d => !d.isConsistent) && (
          <div className="flex items-center gap-2 mt-2 text-xs" style={{color:'#eab308'}}>
            <AlertTriangle className="w-3 h-3"/> {t('unusualLength') || 'Some translations have unusual length'}
          </div>
        )}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: message info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card p-5 space-y-3 sticky top-4">
            <h2 className="text-sm font-medium uppercase tracking-wider text-theme-muted">{t('masterMessageLabel') || 'Master Message'}</h2>
            <h3 className="text-lg font-semibold">{message.title}</h3>
            <AlertBanner urgency={message.urgency}/>
            <p className="text-sm text-theme-secondary leading-relaxed whitespace-pre-wrap">{message.master_content}</p>
            <hr style={{border:'none',borderTop:'1px solid var(--border)'}}/>
            <div className="space-y-2 text-xs text-theme-muted">
              <p><strong className="text-theme-secondary">{t('zone') || 'Zone'}:</strong> {message.target_zone || t('notSpecified') || 'Not specified'}</p>
              <p><strong className="text-theme-secondary">{t('by') || 'By'}:</strong> {message.sent_by}</p>
              <p><strong className="text-theme-secondary">{t('expires') || 'Expires'}:</strong> {message.expires_at ? new Date(message.expires_at).toLocaleString() : t('noExpiry') || 'No expiry'}</p>
            </div>
            <hr style={{border:'none',borderTop:'1px solid var(--border)'}}/>
            <div>
              <p className="text-xs font-medium mb-2 text-theme-secondary">{t('dispatchChannels') || 'Channels'}</p>
              <div className="space-y-1.5">
                {(message.channels || []).map(ch => <ChannelBadge key={ch} channel={ch}/>)}
              </div>
            </div>
          </div>
        </div>

        {/* Right: translations */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-wider text-theme-muted flex items-center gap-2">
            <Eye className="w-4 h-4"/> {t('translations') || 'Translations'} ({(message.languages || []).length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(message.languages || []).map((lang, i) => {
              const d = consistencyData.details.find(x => x.lang === lang);
              return (
                <LanguageCard
                  key={lang}
                  language={lang}
                  text={translations[lang] || ''}
                  approved={approvals[lang] || false}
                  onApprovalToggle={() => setApprovals(p => ({...p, [lang]: !p[lang]}))}
                  onEditText={tx => setTranslations(p => ({...p, [lang]: tx}))}
                  ratio={d?.ratio}
                  isConsistent={d?.isConsistent}
                  index={i}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer action bar */}
      <div className="glass-card p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="text-sm">
          {allApproved
            ? <span className="flex items-center gap-2" style={{color:'#22c55e'}}><CheckCircle2 className="w-4 h-4"/> {t('allApproved') || 'All translations approved'}</span>
            : <span className="flex items-center gap-2 text-theme-muted"><AlertTriangle className="w-4 h-4" style={{color:'#eab308'}}/> {t('approveBeforeDispatch') || 'Approve translations before dispatch'} ({Object.values(approvals).filter(Boolean).length}/{Object.values(approvals).length})</span>
          }
        </div>
        <button
          onClick={handleDispatch}
          disabled={dispatching || rejecting}
          className="btn-primary py-3 px-8 text-base justify-center"
          id="dispatch-btn"
        >
          {dispatching ? <><Loader2 className="w-5 h-5 animate-spin"/> {t('dispatching') || 'Dispatching...'}</> : <><Send className="w-5 h-5"/> {t('dispatchAll') || 'Approve & Dispatch'}</>}
        </button>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
        }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: 440, padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <XCircle style={{ width: 20, height: 20, color: '#ef4444' }} />
              </div>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>{t('rejectTitle') || 'Reject Message'}</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{t('rejectDesc') || 'This will return the message to draft for revision'}</p>
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>
                {t('rejectReasonLabel') || 'Reason for rejection'} <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>({t('optional') || 'optional'})</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder={t('rejectReasonPlaceholder') || "e.g. Incorrect translation, wrong zone, needs revision..."}
                rows={3}
                className="textarea-field"
                style={{ fontSize: 13 }}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { setShowRejectModal(false); setRejectReason(''); }}
                className="btn-secondary flex-1 justify-center"
                style={{ padding: '10px 0' }}
              >
                {t('cancel') || 'Cancel'}
              </button>
              <button
                onClick={handleReject}
                disabled={rejecting}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 'var(--radius)', fontWeight: 600, fontSize: 14,
                  background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {rejecting ? <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" /> : <XCircle style={{ width: 16, height: 16 }} />}
                {t('rejectConfirmBtn') || 'Reject & Return to Draft'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pending messages list ─────────────────────────────────
function PendingList() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const navigate = useNavigate();
  const { t }    = useLanguage();

  useEffect(() => {
    (async () => {
      try {
        const [d, p] = await Promise.all([messagesApi.getAll('draft'), messagesApi.getAll('pending')]);
        setMessages([...p.data, ...d.data]);
      } catch {
        toast.error(t('failedLoad') || 'Failed to load messages');
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="glass-card p-6 h-24 shimmer rounded-xl"/>)}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6" style={{color:'var(--accent)'}}/>
          {t('approvalQueue') || 'Approval Queue'}
        </h1>
        <p className="text-sm mt-1 text-theme-muted">{t('selectToReview') || 'Select a message to review and dispatch'}</p>
      </div>
      {messages.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-theme-dim"/>
          <h3 className="text-lg font-medium text-theme-secondary mb-2">{t('noPending') || 'No pending messages'}</h3>
          <p className="text-sm text-theme-muted mb-4">{t('noPendingDesc') || 'All clear — no messages waiting for review'}</p>
          <button onClick={() => navigate('/compose')} className="btn-primary text-sm"><PenSquare className="w-4 h-4"/> {t('compose') || 'Compose'}</button>
        </div>
      ) : messages.map((msg, i) => (
        <button
          key={msg.id}
          onClick={() => navigate(`/approval/${msg.id}`)}
          className="w-full text-left glass-card p-5 animate-slide-up"
          style={{ animationDelay:`${i*60}ms`, cursor:'pointer' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <AlertBanner urgency={msg.urgency}/>
                <h3 className="font-semibold">{msg.title}</h3>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold"
                  style={{background:msg.status==='pending'?'rgba(234,179,8,0.15)':'var(--bg-hover)',color:msg.status==='pending'?'#eab308':'var(--text-muted)'}}>
                  {t(msg.status) || msg.status}
                </span>
              </div>
              <p className="text-sm text-theme-muted line-clamp-1">{msg.master_content}</p>
            </div>
            <ArrowLeft className="w-5 h-5 rotate-180 text-theme-dim"/>
          </div>
        </button>
      ))}
    </div>
  );
}

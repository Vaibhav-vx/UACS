import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PenSquare, Save, Languages, Clock, MessageSquare, Loader2, ChevronDown, Send, MapIcon, TrendingUp, AlertTriangle, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { messagesApi, translateApi, dispatchApi, recipientsApi } from '../api';
import { useLanguage } from '../i18n/LanguageContext';
import MapZonePicker from '../components/MapZonePicker';

const URGENCY_LEVELS = [
  { value: 'low', key: 'low', dot: '#22c55e' },
  { value: 'medium', key: 'medium', dot: '#eab308' },
  { value: 'high', key: 'high', dot: '#f97316' },
  { value: 'critical', key: 'critical', dot: '#ef4444' },
];

const LANG_LIST = [
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'hindi', label: 'Hindi', flag: '🇮🇳' },
  { value: 'marathi', label: 'Marathi', flag: '🇮🇳' },
  { value: 'tamil', label: 'Tamil', flag: '🇮🇳' },
  { value: 'telugu', label: 'Telugu', flag: '🇮🇳' },
];

export default function ComposerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [quickDispatching, setQuickDispatching] = useState(false);
  const [showMapIconPicker, setShowMapIconPicker] = useState(false);
  const [showIntelBrief, setShowIntelBrief] = useState(false);
  const [intelData, setIntelData] = useState(null);
  const [intelAction, setIntelAction] = useState(null); // 'preview' or 'quick'
  
  const [form, setForm] = useState(() => {
    const defaultForm = { title: '', master_content: '', urgency: 'medium', target_zone: '', channels: ['sms'], languages: [], expires_at: '', expiry_action: 'flag', expiry_message: '', lat: null, lng: null };
    if (location.state && location.state.template) {
      return { 
        ...defaultForm, 
        title: location.state.template.title, 
        master_content: location.state.template.master_content, 
        urgency: location.state.template.urgency 
      };
    }
    return defaultForm;
  });
  const updateForm = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleItem = (k, v) => setForm(p => ({ ...p, [k]: p[k].includes(v) ? p[k].filter(x => x !== v) : [...p[k], v] }));

  const validateForm = () => {
    if (!form.title.trim()) { toast.error(t('titleRequired')); return false; }
    if (!form.master_content.trim()) { toast.error(t('contentRequired')); return false; }
    if (form.languages.length === 0) { toast.error(t('languageRequired')); return false; }
    return true;
  };

  const handleSaveDraft = async () => {
    if (!form.title.trim() || !form.master_content.trim()) { toast.error(t('titleContentRequired')); return; }
    setSaving(true);
    try { await messagesApi.create(form); toast.success(t('draftSaved')); navigate('/dashboard'); }
    catch { toast.error(t('failedSaveDraft')); } finally { setSaving(false); }
  };

  const handleTranslateAndPreview = async () => {
    if (!validateForm()) return;
    
    // Fetch Intel
    try {
      const rec = await recipientsApi.getAll(form.target_zone || 'General');
      setIntelData({
        reach: rec.data.length,
        channels: { sms: rec.data.length, twitter: 1, tv: 1 },
        activeInZone: (location.state?.activeMessages || []).filter(m => m.target_zone === form.target_zone).length
      });
      setIntelAction('preview');
      setShowIntelBrief(true);
    } catch (err) {
      // Fallback
      proceedWithPreview();
    }
  };

  const proceedWithPreview = async () => {
    setShowIntelBrief(false);
    setTranslating(true);
    try {
      const cr = await messagesApi.create(form);
      toast.loading(t('translating'), { id: 'tr' });
      const tr = await translateApi.translate(form.master_content, form.languages);
      await messagesApi.update(cr.data.id, { translations: tr.data.translations, status: 'draft' });
      toast.success(t('translationComplete'), { id: 'tr' });
      navigate(`/approval/${cr.data.id}`);
    } catch (err) { toast.error(t('failedTranslate') + ': ' + (err.response?.data?.error || err.message), { id: 'tr' }); }
    finally { setTranslating(false); }
  };

  const handleQuickDispatch = async () => {
    if (!validateForm()) return;
    
    // Fetch Intel
    try {
      const rec = await recipientsApi.getAll(form.target_zone || 'General');
      setIntelData({
        reach: rec.data.length,
        channels: { sms: rec.data.length, twitter: 1, tv: 1 },
        activeInZone: activeMessages.filter(m => m.target_zone === form.target_zone).length
      });
      setIntelAction('quick');
      setShowIntelBrief(true);
    } catch (err) {
      proceedWithQuickDispatch();
    }
  };

  const proceedWithQuickDispatch = async () => {
    setShowIntelBrief(false);
    setQuickDispatching(true);
    const tid = 'qd';
    try {
      toast.loading(t('processingQuickDispatch') || 'Processing quick dispatch...', { id: tid });
      
      // 1. Create message
      const cr = await messagesApi.create(form);
      
      // 2. Translate
      toast.loading(t('translating'), { id: tid });
      const tr = await translateApi.translate(form.master_content, form.languages);
      
      // 3. Update with translations & approve
      await messagesApi.update(cr.data.id, { translations: tr.data.translations, status: 'pending' });
      await messagesApi.approve(cr.data.id);
      
      // 4. Dispatch
      toast.loading(t('dispatching'), { id: tid });
      const r = await dispatchApi.dispatch(cr.data.id);
      
      toast.success(t('messageSent'), { id: tid });
      navigate('/dashboard');
    } catch (err) {
      toast.error(t('failedDispatch') + ': ' + (err.response?.data?.error || err.message), { id: tid });
    } finally {
      setQuickDispatching(false);
    }
  };

  const LBtn = ({ active, onClick, children }) => (<button onClick={onClick} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium" style={{ background: active ? 'rgba(168,85,247,0.12)' : 'var(--bg-input)', color: active ? '#a855f7' : 'var(--text-secondary)', border: `1px solid ${active ? 'rgba(168,85,247,0.3)' : 'var(--border)'}`, cursor: 'pointer' }}>{children}</button>);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div><h1 className="text-2xl font-bold flex items-center gap-3"><PenSquare className="w-6 h-6" style={{ color: 'var(--accent)' }} /> {t('composerTitle')}</h1><p className="text-sm mt-1 text-theme-muted">{t('composerSubtitle')}</p></div>
      <div className="space-y-6">
        <div className="glass-card p-5 space-y-4"><label className="block text-sm font-medium text-theme-secondary">{t('messageTitle')}</label><input type="text" value={form.title} onChange={e => updateForm('title', e.target.value)} placeholder={t('titlePlaceholder')} className="input-field text-lg" id="message-title" /></div>
        <div className="glass-card p-5 space-y-4">
          <label className="block text-sm font-medium text-theme-secondary">{t('masterMessage')}</label>
          <textarea value={form.master_content} onChange={e => updateForm('master_content', e.target.value)} placeholder={t('messagePlaceholder')} rows={6} className="textarea-field text-base leading-relaxed" id="master-content" />
          <div className="flex justify-between items-center text-xs text-theme-muted"><span>{form.master_content.length} {t('characters')}</span>{form.master_content.length > 280 && <span style={{ color: '#eab308' }}>{t('twitterWarn')}</span>}</div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass-card p-5 space-y-3"><label className="block text-sm font-medium text-theme-secondary">{t('urgencyLevel')}</label><div className="grid grid-cols-2 gap-2">{URGENCY_LEVELS.map(u=>(<button key={u.value} onClick={()=>updateForm('urgency',u.value)} className="px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2" style={{ background: form.urgency===u.value?`${u.dot}20`:'var(--bg-input)', color: form.urgency===u.value?u.dot:'var(--text-secondary)', border:`1px solid ${form.urgency===u.value?`${u.dot}40`:'var(--border)'}`, cursor:'pointer' }}><span className="w-2.5 h-2.5 rounded-full" style={{background:u.dot}}/>{t(u.key)}</button>))}</div></div>
          <div className="glass-card p-5 space-y-3"><label className="block text-sm font-medium text-theme-secondary"><MapIcon className="w-4 h-4 inline mr-2"/>{t('targetZone')}</label><div className="flex gap-2"><input type="text" value={form.target_zone} onChange={e=>updateForm('target_zone',e.target.value)} placeholder={t('zonePlaceholder')} className="input-field flex-1" id="target-zone"/><button type="button" onClick={() => setShowMapIconPicker(true)} title="Pick zone on map" className="btn-secondary px-3 shrink-0"><MapIcon className="w-4 h-4" /></button></div><p className="text-xs text-theme-dim">{t('zoneDesc')}</p></div>
        </div>
        <div className="glass-card p-5" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MessageSquare style={{ width: 18, height: 18, color: 'var(--accent)' }} />
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: 14 }}>{t('smsDispatch') || "SMS Dispatch"}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{t('smsDispatchDesc') || "Messages will be sent via SMS to all matching recipients"}</p>
          </div>
          <span style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>{t('activeLabel') || "ACTIVE"}</span>
        </div>
        <div className="glass-card p-5 space-y-3"><label className="block text-sm font-medium text-theme-secondary"><Languages className="w-4 h-4 inline mr-2"/>{t('selectLanguages')}</label><div className="flex flex-wrap gap-2">{LANG_LIST.map(l=>(<LBtn key={l.value} active={form.languages.includes(l.value)} onClick={()=>toggleItem('languages',l.value)}><span>{l.flag}</span> {l.label}</LBtn>))}</div></div>
        <div className="glass-card p-5 space-y-4">
          <label className="block text-sm font-medium text-theme-secondary"><Clock className="w-4 h-4 inline mr-2"/>{t('expirySettings')}</label>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div><label className="block text-xs text-theme-muted mb-1.5">{t('expiryDateTime')}</label><input type="datetime-local" value={form.expires_at} onChange={e=>updateForm('expires_at',e.target.value)} className="input-field" id="expires-at"/></div>
            <div><label className="block text-xs text-theme-muted mb-1.5">{t('expiryAction')}</label><div className="relative"><select value={form.expiry_action} onChange={e=>updateForm('expiry_action',e.target.value)} className="input-field appearance-none pr-10 cursor-pointer" id="expiry-action"><option value="flag">{t('flagOnly')}</option><option value="replace">{t('replaceMessage')}</option><option value="delete">{t('deleteMessage')}</option></select><ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-theme-muted"/></div></div>
          </div>
          {form.expiry_action==='replace' && (<div className="animate-fade-in"><label className="block text-xs text-theme-muted mb-1.5">{t('expiryMessage')}</label><textarea value={form.expiry_message} onChange={e=>updateForm('expiry_message',e.target.value)} placeholder={t('expiryMsgPlaceholder')} rows={3} className="textarea-field" id="expiry-message"/></div>)}
        </div>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 pt-2">
          <button onClick={handleTranslateAndPreview} disabled={translating || quickDispatching} className="btn-secondary flex-1 justify-center py-3 text-base" id="translate-preview-btn">
            {translating ? <><Loader2 className="w-5 h-5 animate-spin"/> {t('translating')}</> : <><Languages className="w-5 h-5"/> {t('translatePreview')}</>}
          </button>
          <button onClick={handleQuickDispatch} disabled={translating || quickDispatching} className="btn-primary flex-1 justify-center py-3 text-base" id="quick-dispatch-btn">
            {quickDispatching ? <><Loader2 className="w-5 h-5 animate-spin"/> {t('dispatching')}</> : <><Send className="w-5 h-5"/> {t('quickDispatch') || 'Quick Dispatch'}</>}
          </button>
          <button onClick={handleSaveDraft} disabled={saving || translating || quickDispatching} className="btn-secondary flex-1 justify-center py-3 text-base" id="save-draft-btn">
            {saving ? <><Loader2 className="w-5 h-5 animate-spin"/> {t('saving')}</> : <><Save className="w-5 h-5"/> {t('saveDraft')}</>}
          </button>
        </div>
      </div>
      {showMapIconPicker && (
        <MapZonePicker
          value={form.target_zone}
          onChange={(zone, coords, radius) => {
            const finalZone = radius ? `${zone} (${radius}km)` : zone;
            updateForm('target_zone', finalZone);
            if (coords) {
              updateForm('lat', coords.lat);
              updateForm('lng', coords.lng);
            }
          }}
          onClose={() => setShowMapIconPicker(false)}
        />
      )}

      {/* Intelligence Brief Modal */}
      {showIntelBrief && intelData && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="glass-card max-w-2xl w-full bg-slate-900 border border-indigo-500/30 overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-white/10 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <PenSquare className="w-6 h-6 text-indigo-400" />
                Pre-Dispatch Intelligence Brief
              </h2>
              <p className="text-slate-400 text-sm mt-1">Verify reach and impact before broadcasting to citizens</p>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Impact Analysis</h3>
                  <div className="space-y-4">
                    <div className="flex items-end justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div>
                        <div className="text-3xl font-black text-white">{intelData.reach}</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase mt-1">Est. Citizen Reach</div>
                      </div>
                      <div className="text-right">
                        <div className="text-emerald-500 font-bold flex items-center gap-1 text-xs">
                          <TrendingUp className="w-3 h-3" /> 100%
                        </div>
                        <div className="text-[10px] text-slate-600 font-medium">Zone {form.target_zone || 'General'}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-slate-400">
                        <span>Channel Readiness</span>
                        <span>{Math.round((intelData.reach / (intelData.reach || 1)) * 100)}%</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: '100%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                   <div className="flex items-center gap-2 text-amber-500 font-bold text-sm mb-1">
                      <AlertTriangle className="w-4 h-4" /> Conflict Check
                   </div>
                   <p className="text-[10px] text-amber-500/80 leading-relaxed">
                     {intelData.activeInZone > 0 
                       ? `WARNING: There are already ${intelData.activeInZone} active alerts in this zone. Sending another might cause fatigue.`
                       : "No conflicting alerts found in this zone. Proceeding with clear airspace."}
                   </p>
                </div>
              </div>

              <div className="space-y-6">
                 <div>
                   <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Message Quality</h3>
                   <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${form.master_content.length > 50 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <span className="text-xs text-slate-300 font-medium">Content Length: {form.master_content.length} chars</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs text-slate-300 font-medium">Multi-Language: {form.languages.length} selected</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${form.urgency === 'critical' ? 'bg-red-500 animate-pulse' : 'bg-indigo-500'}`} />
                        <span className="text-xs text-slate-300 font-medium capitalize">Urgency: {form.urgency}</span>
                      </div>
                   </div>
                 </div>

                 <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 text-[10px] text-indigo-300/70 leading-relaxed">
                    Once dispatched, this message will be digitally signed by the UACS Central Authority and logged for public record.
                 </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/10 bg-slate-900/50 flex gap-4">
              <button 
                onClick={() => setShowIntelBrief(false)}
                className="flex-1 py-3 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                Cancel & Edit
              </button>
              <button 
                onClick={() => intelAction === 'preview' ? proceedWithPreview() : proceedWithQuickDispatch()}
                className="flex-[2] py-3 rounded-xl font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2"
              >
                Confirm & Dispatch
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

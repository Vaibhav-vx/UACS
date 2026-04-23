import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PenSquare, Save, Languages, MapPin, Clock, MessageSquare, Loader2, ChevronDown, Send, Map } from 'lucide-react';
import toast from 'react-hot-toast';
import { messagesApi, translateApi, dispatchApi } from '../api';
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
  const [showMapPicker, setShowMapPicker] = useState(false);
  
  const [form, setForm] = useState(() => {
    const defaultForm = { title: '', master_content: '', urgency: 'medium', target_zone: '', channels: ['sms'], languages: [], expires_at: '', expiry_action: 'flag', expiry_message: '' };
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
          <div className="glass-card p-5 space-y-3"><label className="block text-sm font-medium text-theme-secondary"><MapPin className="w-4 h-4 inline mr-2"/>{t('targetZone')}</label><div className="flex gap-2"><input type="text" value={form.target_zone} onChange={e=>updateForm('target_zone',e.target.value)} placeholder={t('zonePlaceholder')} className="input-field flex-1" id="target-zone"/><button type="button" onClick={() => setShowMapPicker(true)} title="Pick zone on map" className="btn-secondary px-3 shrink-0"><Map className="w-4 h-4" /></button></div><p className="text-xs text-theme-dim">{t('zoneDesc')}</p></div>
        </div>
        <div className="glass-card p-5" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MessageSquare style={{ width: 18, height: 18, color: 'var(--accent)' }} />
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: 14 }}>SMS Dispatch</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Messages will be sent via SMS to all matching recipients</p>
          </div>
          <span style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>ACTIVE</span>
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
            {quickDispatching ? <><Loader2 className="w-5 h-5 animate-spin"/> {t('dispatching')}</> : <><Send className="w-5 h-5"/> {t('skipApproval') || 'Quick Dispatch'}</>}
          </button>
          <button onClick={handleSaveDraft} disabled={saving || translating || quickDispatching} className="btn-secondary flex-1 justify-center py-3 text-base" id="save-draft-btn">
            {saving ? <><Loader2 className="w-5 h-5 animate-spin"/> {t('saving')}</> : <><Save className="w-5 h-5"/> {t('saveDraft')}</>}
          </button>
        </div>
      </div>
      {showMapPicker && (
        <MapZonePicker
          value={form.target_zone}
          onChange={(zone) => updateForm('target_zone', zone)}
          onClose={() => setShowMapPicker(false)}
        />
      )}
    </div>
  );
}

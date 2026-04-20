import { useState } from 'react';
import { CheckCircle, Edit3, X, Check } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const LANG_META = { hindi: { label: 'Hindi', code: 'HI', flag: '🇮🇳' }, urdu: { label: 'Urdu', code: 'UR', flag: '🇵🇰' }, tamil: { label: 'Tamil', code: 'TA', flag: '🏳️' }, bengali: { label: 'Bengali', code: 'BN', flag: '🇧🇩' }, telugu: { label: 'Telugu', code: 'TE', flag: '🏳️' } };

export default function LanguageCard({ language, text, approved, onApprovalToggle, onEditText, ratio, isConsistent, index = 0 }) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(text);
  const { t } = useLanguage();
  const meta = LANG_META[language] || { label: language, code: language.slice(0, 2).toUpperCase(), flag: '🏳️' };

  return (
    <div className="glass-card p-4 animate-slide-up flex flex-col gap-3" style={{ animationDelay: `${index * 80}ms` }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5"><span className="text-lg">{meta.flag}</span><div><h4 className="text-sm font-semibold">{meta.label}</h4><span className="text-[10px] uppercase tracking-wider text-theme-muted">{meta.code}</span></div></div>
        {!editing && <button onClick={() => { setEditText(text); setEditing(true); }} className="p-1.5 rounded-md" style={{ background: 'var(--bg-hover)', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} title={t('editTranslation')}><Edit3 className="w-3.5 h-3.5" /></button>}
      </div>
      {editing ? (
        <div className="space-y-2"><textarea value={editText} onChange={e => setEditText(e.target.value)} rows={4} className="textarea-field text-sm" /><div className="flex justify-end gap-2"><button onClick={() => { setEditText(text); setEditing(false); }} className="btn-secondary text-xs py-1 px-2"><X className="w-3 h-3" /> {t('cancel')}</button><button onClick={() => { onEditText(editText); setEditing(false); }} className="btn-primary text-xs py-1 px-2"><Check className="w-3 h-3" /> {t('save')}</button></div></div>
      ) : (<p className="text-sm text-theme-secondary leading-relaxed whitespace-pre-wrap flex-1">{text || t('noTranslation')}</p>)}
      <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--border)' }}>
        <span className="text-xs text-theme-dim">{text?.length || 0} {t('characters')}</span>
        <button onClick={onApprovalToggle} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: approved ? 'rgba(34,197,94,0.15)' : 'var(--bg-hover)', color: approved ? '#22c55e' : 'var(--text-muted)', border: `1px solid ${approved ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`, cursor: 'pointer' }}><CheckCircle className="w-3.5 h-3.5" /> {approved ? t('approved') : t('approveTranslation')}</button>
      </div>
    </div>
  );
}

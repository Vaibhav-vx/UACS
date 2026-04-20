import { useLanguage } from '../i18n/LanguageContext';

const URGENCY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TWITTER PREVIEW
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function TwitterPreview({ text }) {
  const { t } = useLanguage();
  const truncated = text.length > 280 ? text.substring(0, 277) + '...' : text;
  const isThread = text.length > 280;
  return (
    <div className="glass-card p-0 overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-theme-muted" style={{ borderBottom: '1px solid var(--border)' }}>
        <span>🐦</span> {t('twitterPreview') || 'Twitter Preview'}
      </div>
      <div className="p-4" style={{ background: 'var(--bg-card)' }}>
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #1d9bf0, #0c7abf)' }}>
            <span className="text-white text-lg font-bold">G</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="font-bold text-sm">{t('postedByGovt') || "Government Authority"}</span>
              <span style={{ color: '#1d9bf0' }}>✓</span>
              <span className="text-xs text-theme-muted">@GovtAuthority</span>
              <span className="text-xs text-theme-dim">· {t('justNow') || "Just now"}</span>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>{truncated}</p>
            {isThread && (
              <div className="mt-2 inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase" style={{ background: 'rgba(29,155,240,0.1)', color: '#1d9bf0' }}>
                [1/2] {t('willBeSplitThread') || "Thread"}
              </div>
            )}
            <div className="mt-3 flex items-center justify-between text-xs text-theme-dim">
              <span>{text.length} / 280 {t('charactersLeft') || 'characters'}</span>
              {text.length > 280 && <span style={{ color: '#eab308' }}>⚠ Will be split into thread</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SMS PREVIEW
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function SMSPreview({ text }) {
  const { t } = useLanguage();
  const truncated = text.length > 160 ? text.substring(0, 157) + '...' : text;
  const parts = Math.ceil(text.length / 160);

  return (
    <div className="glass-card p-0 overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-theme-muted" style={{ borderBottom: '1px solid var(--border)' }}>
        <span>📱</span> {t('smsPreview') || 'SMS Preview'}
      </div>
      <div className="p-4 flex justify-center">
        <div className="w-64 rounded-2xl overflow-hidden" style={{ border: '2px solid var(--border)', background: 'var(--bg-base)' }}>
          {/* Phone status bar */}
          <div className="px-4 py-2 flex items-center justify-between text-[10px] text-theme-dim" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
            <span className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>GOVT-UACS</span>
            <span>{t('justNow') || "now"}</span>
          </div>
          {/* Chat area */}
          <div className="p-3 min-h-[120px]">
            <div className="rounded-xl px-3 py-2 text-sm text-white max-w-[90%] leading-relaxed" style={{ background: '#22c55e', borderBottomLeftRadius: '4px' }}>
              {truncated}
            </div>
          </div>
          {/* Footer */}
          <div className="px-3 py-2 text-[10px] text-theme-dim flex justify-between items-center" style={{ borderTop: '1px solid var(--border)' }}>
            <span>{text.length} / 160 {t('charactersLeft') || 'characters'}</span>
          </div>
        </div>
      </div>
      {parts > 1 && (
        <div className="px-4 pb-3 text-xs text-center" style={{ color: '#eab308' }}>
          ⚠ {t('smsSplitWarning') || `SMS will be split into ${parts} parts`}
        </div>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RADIO PREVIEW
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function RadioPreview({ text }) {
  const { t } = useLanguage();
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const fullScript = `${t('radioIntro') || "Attention listeners. This is an official government announcement."} ${text} ${t('radioOutro') || "This message is brought to you by the Government Authority. Thank you."}`;
  const scriptWords = fullScript.split(/\s+/).filter(Boolean).length;
  const readTimeSeconds = Math.round((scriptWords / 130) * 60);

  return (
    <div className="glass-card p-0 overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-theme-muted" style={{ borderBottom: '1px solid var(--border)' }}>
        <span>📻</span> {t('radioPreview') || 'Radio Preview'}
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>{t('radioScriptLabel') || "RADIO BROADCAST SCRIPT"}</span>
          <span className="text-theme-muted">{t('estimatedReadTime') || 'Est. read time'}: ~{readTimeSeconds}{t('secondsShort') || "s"}</span>
        </div>
        <div className="p-4 rounded-lg text-sm leading-relaxed italic" style={{ background: 'var(--bg-input)', borderLeft: '3px solid var(--accent)', color: 'var(--text-secondary)' }}>
          "{fullScript}"
        </div>
        <div className="text-xs text-theme-dim text-right">
          {scriptWords} words · ~{readTimeSeconds} {t('seconds') || 'seconds'}
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TV TICKER PREVIEW
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function TVPreview({ text }) {
  const { t } = useLanguage();
  const tickerText = text.length > 100 ? text.substring(0, 97) + '...' : text;

  return (
    <div className="glass-card p-0 overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-theme-muted" style={{ borderBottom: '1px solid var(--border)' }}>
        <span>📺</span> {t('tvPreview') || 'TV Ticker Preview'}
      </div>
      <div className="p-4">
        <div className="rounded-lg overflow-hidden" style={{ background: '#0f0f0f', border: '2px solid #333' }}>
          {/* Screen area */}
          <div className="p-6 flex items-center justify-center text-center" style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}>
            <span className="text-4xl">📡</span>
          </div>
          {/* Ticker bar */}
          <div className="flex items-stretch" style={{ background: '#111' }}>
            <div className="px-3 py-2 flex items-center shrink-0" style={{ background: '#ef4444' }}>
              <span className="text-white text-[10px] font-black uppercase tracking-wider animate-pulse">{t('breaking') || "BREAKING"}</span>
            </div>
            <div className="px-2 py-2 flex items-center shrink-0" style={{ background: '#1a1a1a', borderLeft: '2px solid #ef4444', borderRight: '1px solid #333' }}>
              <span className="text-[10px] font-bold text-white uppercase tracking-wider whitespace-nowrap">{t('govtAlert') || "GOVT ALERT"}</span>
            </div>
            <div className="flex-1 overflow-hidden py-2 px-2 flex items-center">
              <div className="whitespace-nowrap text-white text-xs font-medium" style={{ animation: 'ticker-scroll 15s linear infinite' }}>
                {tickerText} &nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp; {tickerText} &nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp; {tickerText}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// WEBSITE PREVIEW
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function WebsitePreview({ text, title, urgency, expiresAt }) {
  const { t } = useLanguage();
  const bgColor = URGENCY_COLORS[urgency] || URGENCY_COLORS.medium;

  return (
    <div className="glass-card p-0 overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-theme-muted" style={{ borderBottom: '1px solid var(--border)' }}>
        <span>🌐</span> {t('websitePreview') || 'Website Preview'}
      </div>
      <div className="p-4">
        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {/* Banner */}
          <div className="p-4" style={{ background: `${bgColor}18`, borderLeft: `4px solid ${bgColor}` }}>
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">⚠️</span>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-base mb-1" style={{ color: bgColor }}>{title}</h4>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{text}</p>
                <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] text-theme-dim">
                  <span>{t('postedBy') || "Posted by"} {t('postedByGovt') || "Government Authority"}</span>
                  <span>|</span>
                  <span>{t('justNow') || "Just now"}</span>
                  {expiresAt && (
                    <>
                      <span>|</span>
                      <span>{t('expires') || 'Expires'}: {new Date(expiresAt).toLocaleString()}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN: Channel Previews Section
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function ChannelPreviews({ message }) {
  const { t } = useLanguage();
  const channels = message?.channels || [];
  const text = message?.master_content || '';
  const title = message?.title || '';
  const urgency = message?.urgency || 'medium';
  const expiresAt = message?.expires_at;

  if (channels.length === 0) return null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-medium uppercase tracking-wider text-theme-muted flex items-center gap-2">
          📡 {t('previewPerChannel') || 'Preview Per Channel'}
        </h2>
        <p className="text-xs text-theme-dim mt-1">
          {t('previewPerChannelSubtitle') || 'This is how your message will appear on each selected channel'}
        </p>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {channels.includes('twitter') && <TwitterPreview text={text} />}
        {channels.includes('sms') && <SMSPreview text={text} />}
        {channels.includes('radio') && <RadioPreview text={text} />}
        {channels.includes('tv') && <TVPreview text={text} />}
        {channels.includes('website') && <WebsitePreview text={text} title={title} urgency={urgency} expiresAt={expiresAt} />}
      </div>
    </div>
  );
}

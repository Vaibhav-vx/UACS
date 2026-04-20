import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookTemplate, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';

// All templates use translation keys for name and message
const TEMPLATES = [
  { id: 1, icon: '🌊', nameKey: 'tplFloodName', category: 'emergency', urgency: 'critical', msgKey: 'tplFloodMsg' },
  { id: 2, icon: '🔥', nameKey: 'tplFireName', category: 'emergency', urgency: 'critical', msgKey: 'tplFireMsg' },
  { id: 3, icon: '🏥', nameKey: 'tplHealthName', category: 'health', urgency: 'high', msgKey: 'tplHealthMsg' },
  { id: 4, icon: '🚧', nameKey: 'tplRoadName', category: 'traffic', urgency: 'medium', msgKey: 'tplRoadMsg' },
  { id: 5, icon: '⚡', nameKey: 'tplPowerName', category: 'utilities', urgency: 'medium', msgKey: 'tplPowerMsg' },
  { id: 6, icon: '🌪️', nameKey: 'tplCycloneName', category: 'emergency', urgency: 'critical', msgKey: 'tplCycloneMsg' },
  { id: 7, icon: '🏫', nameKey: 'tplSchoolName', category: 'education', urgency: 'low', msgKey: 'tplSchoolMsg' },
  { id: 8, icon: '💧', nameKey: 'tplWaterName', category: 'utilities', urgency: 'medium', msgKey: 'tplWaterMsg' },
  { id: 9, icon: '🚨', nameKey: 'tplCurfewName', category: 'law_order', urgency: 'high', msgKey: 'tplCurfewMsg' },
  { id: 10, icon: '📢', nameKey: 'tplAnnounceName', category: 'general', urgency: 'low', msgKey: 'tplAnnounceMsg' },
];

const CATEGORIES = [
  { id: 'all', labelKey: 'allCategories' },
  { id: 'emergency', labelKey: 'emergency' },
  { id: 'health', labelKey: 'health' },
  { id: 'traffic', labelKey: 'traffic' },
  { id: 'utilities', labelKey: 'utilities' },
  { id: 'education', labelKey: 'education' },
  { id: 'law_order', labelKey: 'lawOrder' },
  { id: 'general', labelKey: 'general' },
];

const URGENCY_STYLES = {
  low:      { dot: '#22c55e', border: '#22c55e40', color: '#22c55e' },
  medium:   { dot: '#eab308', border: '#eab30840', color: '#ca8a04' },
  high:     { dot: '#f97316', border: '#f9731640', color: '#ea580c' },
  critical: { dot: '#ef4444', border: '#ef444440', color: '#ef4444' },
};

const CATEGORY_STYLES = {
  emergency: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
  health:    { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
  traffic:   { bg: 'rgba(249,115,22,0.1)', color: '#f97316' },
  utilities: { bg: 'rgba(168,85,247,0.1)', color: '#a855f7' },
  education: { bg: 'rgba(34,197,94,0.1)', color: '#22c55e' },
  law_order: { bg: 'rgba(71,85,105,0.1)', color: '#64748b' },
  general:   { bg: 'rgba(100,116,139,0.1)', color: '#475569' },
};

export default function TemplatesPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredTemplates = useMemo(() => {
    return TEMPLATES.filter(tpl => {
      const name = t(tpl.nameKey) || '';
      const msg  = t(tpl.msgKey)  || '';
      const matchSearch =
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = activeCategory === 'all' || tpl.category === activeCategory;
      return matchSearch && matchCat;
    });
  }, [searchTerm, activeCategory, t]);

  const handleUseTemplate = (tpl) => {
    // Always send the English message as master_content (backend stores English)
    const englishMsg = translations_en[tpl.msgKey] || t(tpl.msgKey);
    const englishName = translations_en[tpl.nameKey] || t(tpl.nameKey);
    navigate('/compose', {
      state: {
        template: {
          title: englishName,
          master_content: englishMsg,
          urgency: tpl.urgency,
        }
      }
    });
    toast.success(t('templateLoaded') || 'Template loaded in composer');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <BookTemplate className="w-6 h-6" style={{ color: 'var(--accent)' }} />
          {t('messageTemplates') || 'Message Templates'}
        </h1>
        <p className="text-sm mt-1 text-theme-muted">
          {t('templatesSubtitle') || 'Pre-approved templates for common government alerts.'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between glass-card p-4">
        <div className="flex-1 w-full md:max-w-md relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" />
          <input
            type="text"
            placeholder={t('searchTemplates') || 'Search templates...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-9 w-full"
          />
        </div>

        <div className="flex gap-2 bg-[var(--bg-input)] p-1 rounded-lg border border-[var(--border)] overflow-x-auto w-full md:w-auto scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors"
              style={{
                background: activeCategory === cat.id ? 'var(--accent)' : 'transparent',
                color: activeCategory === cat.id ? 'white' : 'var(--text-secondary)',
              }}
            >
              {t(cat.labelKey) || cat.id}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTemplates.map((tpl, i) => {
          const name = t(tpl.nameKey) || tpl.nameKey;
          const msg  = t(tpl.msgKey)  || '';
          const us   = URGENCY_STYLES[tpl.urgency];
          const cs   = CATEGORY_STYLES[tpl.category];
          return (
            <div
              key={tpl.id}
              className="glass-card flex flex-col p-5 animate-slide-up hover:shadow-lg transition-shadow"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex items-center gap-4 border-b border-[var(--border)] pb-4 mb-4">
                <div className="text-4xl">{tpl.icon}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-theme-primary truncate">{name}</h3>
                  <div className="flex gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider"
                      style={{ background: cs.bg, color: cs.color }}>
                      {t(tpl.category) || tpl.category}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 border"
                      style={{ borderColor: us.border, color: us.color }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: us.dot }} />
                      {t(tpl.urgency) || tpl.urgency}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 text-sm text-[var(--text-secondary)] leading-relaxed italic mb-4">
                "{msg.length > 80 ? msg.substring(0, 80) + '...' : msg}"
              </div>

              <button onClick={() => handleUseTemplate(tpl)} className="btn-primary w-full justify-center py-2">
                {t('useTemplate') || 'Use Template'}
              </button>
            </div>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="glass-card p-12 text-center">
          <BookTemplate className="w-12 h-12 mx-auto mb-4 text-theme-dim" />
          <h3 className="text-lg font-medium text-theme-secondary mb-2">{t('noTemplatesFound') || 'No templates found'}</h3>
          <p className="text-sm text-theme-muted mb-4">{t('adjustFilters') || 'Try adjusting your search or category filters.'}</p>
          <button onClick={() => { setSearchTerm(''); setActiveCategory('all'); }} className="btn-secondary text-sm">
            {t('clearFilters') || 'Clear Filters'}
          </button>
        </div>
      )}
    </div>
  );
}

// English fallback for master_content (always English for the backend)
const translations_en = {
  tplFloodName: 'Flood Warning',
  tplFloodMsg: 'A severe flood warning has been issued for [ZONE]. All residents in low-lying areas must evacuate immediately to the nearest relief camp. Carry essential documents, medicines, and 3 days of food supply. Do not attempt to cross flooded roads.',
  tplFireName: 'Fire Alert',
  tplFireMsg: 'A major fire has been reported in [ZONE]. Residents are advised to evacuate the area immediately. Keep windows and doors closed. Avoid the area and allow emergency services to operate. Fire brigade and emergency teams are on the way.',
  tplHealthName: 'Health Advisory',
  tplHealthMsg: 'A health advisory has been issued for [ZONE]. Residents are advised to avoid crowded places, wear masks, and maintain hand hygiene. Anyone experiencing symptoms should contact the health helpline immediately. Medical teams have been deployed.',
  tplRoadName: 'Road Closure',
  tplRoadMsg: 'The road at [ZONE] will be closed from [TIME] to [TIME] due to maintenance work. Commuters are requested to use alternate routes. We regret the inconvenience caused and thank you for your cooperation.',
  tplPowerName: 'Power Outage',
  tplPowerMsg: 'A scheduled power outage will affect [ZONE] from [TIME] to [TIME]. Residents are advised to store water and charge essential devices in advance. Emergency services will remain operational. We apologize for the inconvenience.',
  tplCycloneName: 'Cyclone Warning',
  tplCycloneMsg: 'A severe cyclone warning has been issued for [ZONE]. Winds of up to 150 km/h are expected. All residents must move to designated cyclone shelters immediately. Do not venture outdoors. Keep emergency kits ready.',
  tplSchoolName: 'School Closure',
  tplSchoolMsg: 'All schools and educational institutions in [ZONE] will remain closed on [DATE] due to [REASON]. Parents are advised to keep children at home. Online classes will continue as scheduled. Further updates will be provided.',
  tplWaterName: 'Water Supply Disruption',
  tplWaterMsg: 'Water supply in [ZONE] will be disrupted from [TIME] to [TIME] due to maintenance of the main pipeline. Residents are advised to store sufficient water. Water tankers will be made available at key locations.',
  tplCurfewName: 'Curfew Notice',
  tplCurfewMsg: 'A curfew has been imposed in [ZONE] with immediate effect until further notice. All residents must remain indoors. Essential services are exempt. Strict action will be taken against violators. Stay calm and cooperate with authorities.',
  tplAnnounceName: 'General Announcement',
  tplAnnounceMsg: 'This is an important announcement from the Government Authority for residents of [ZONE]. [ADD YOUR MESSAGE HERE]. For more information contact the helpline at 1800-XXX-XXXX.',
};

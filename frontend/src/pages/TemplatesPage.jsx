import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookTemplate, Search, Plus, Trash2, Edit, RotateCcw, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../ThemeContext';

const DEFAULT_TEMPLATES = [
  { id: 1, icon: '🌊', name: 'Flood Warning', category: 'emergency', urgency: 'critical', message: 'A severe flood warning has been issued for [ZONE]. All residents in low-lying areas must evacuate immediately to the nearest relief camp. Carry essential documents, medicines, and 3 days of food supply. Do not attempt to cross flooded roads.' },
  { id: 2, icon: '🔥', name: 'Fire Alert', category: 'emergency', urgency: 'critical', message: 'A major fire has been reported in [ZONE]. Residents are advised to evacuate the area immediately. Keep windows and doors closed. Avoid the area and allow emergency services to operate. Fire brigade and emergency teams are on the way.' },
  { id: 3, icon: '🏥', name: 'Health Advisory', category: 'health', urgency: 'high', message: 'A health advisory has been issued for [ZONE]. Residents are advised to avoid crowded places, wear masks, and maintain hand hygiene. Anyone experiencing symptoms should contact the health helpline immediately. Medical teams have been deployed.' },
  { id: 4, icon: '🚧', name: 'Road Closure', category: 'traffic', urgency: 'medium', message: 'The road at [ZONE] will be closed from [TIME] to [TIME] due to maintenance work. Commuters are requested to use alternate routes. We regret the inconvenience caused and thank you for your cooperation.' },
  { id: 5, icon: '⚡', name: 'Power Outage', category: 'utilities', urgency: 'medium', message: 'A scheduled power outage will affect [ZONE] from [TIME] to [TIME]. Residents are advised to store water and charge essential devices in advance. Emergency services will remain operational. We apologize for the inconvenience.' },
  { id: 6, icon: '🌪️', name: 'Cyclone Warning', category: 'emergency', urgency: 'critical', message: 'A severe cyclone warning has been issued for [ZONE]. Winds of up to 150 km/h are expected. All residents must move to designated cyclone shelters immediately. Do not venture outdoors. Keep emergency kits ready.' },
  { id: 7, icon: '🏫', name: 'School Closure', category: 'education', urgency: 'low', message: 'All schools and educational institutions in [ZONE] will remain closed on [DATE] due to [REASON]. Parents are advised to keep children at home. Online classes will continue as scheduled.' },
  { id: 8, icon: '💧', name: 'Water Disruption', category: 'utilities', urgency: 'medium', message: 'Water supply in [ZONE] will be disrupted from [TIME] to [TIME] due to maintenance of the main pipeline. Residents are advised to store sufficient water. Water tankers will be made available at key locations.' },
  { id: 9, icon: '🚨', name: 'Curfew Notice', category: 'law_order', urgency: 'high', message: 'A curfew has been imposed in [ZONE] with immediate effect until further notice. All residents must remain indoors. Essential services are exempt. Strict action will be taken against violators. Stay calm and cooperate with authorities.' },
  { id: 10, icon: '🏢', name: 'Earthquake Alert', category: 'emergency', urgency: 'critical', message: 'A major earthquake of magnitude [MAGNITUDE] has occurred near [ZONE]. Strong aftershocks are expected. If indoors, drop, cover, and hold under sturdy furniture. If outdoors, move away from buildings, power lines, and trees. Do not use elevators.' },
  { id: 11, icon: '☀️', name: 'Heatwave Advisory', category: 'health', urgency: 'high', message: 'An extreme heatwave warning is active for [ZONE] with temperatures expected to exceed [TEMP]°C. Avoid outdoor activity between 11:00 AM and 4:00 PM. Drink plenty of water. Keep vulnerable individuals, children, and pets indoors.' },
  { id: 12, icon: '☣️', name: 'Chemical Gas Leak', category: 'emergency', urgency: 'critical', message: 'A hazardous gas leak has been reported at [ZONE]. Residents are urged to shelter-in-place immediately. Close all doors, windows, and ventilation inlets. Seal doors with wet towels. Evacuate only if directed by emergency responders.' },
  { id: 13, icon: '🏄', name: 'Tsunami Warning', category: 'emergency', urgency: 'critical', message: 'A Tsunami warning has been issued following marine tectonic activity. All residents within coastal areas of [ZONE] must evacuate immediately to high ground. Do not return to the coast until official clearance is declared.' },
  { id: 14, icon: '⛰️', name: 'Landslide Alert', category: 'emergency', urgency: 'high', message: 'Continuous heavy rainfall is triggering landslide risks in the hilly areas of [ZONE]. Residents near steep slopes must relocate to safer zones immediately. Avoid all travel on mountain roads. Contact emergency helpline for rescue.' },
  { id: 15, icon: '📢', name: 'General Announcement', category: 'general', urgency: 'low', message: 'This is an important announcement from the Authority for residents of [ZONE]. [ADD YOUR MESSAGE HERE]. For more information contact the helpline.' },
];

const CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'emergency', label: 'Emergency' },
  { id: 'health', label: 'Health' },
  { id: 'traffic', label: 'Traffic' },
  { id: 'utilities', label: 'Utilities' },
  { id: 'education', label: 'Education' },
  { id: 'law_order', label: 'Law & Order' },
  { id: 'general', label: 'General' },
];

const URGENCY_STYLES = {
  low:      { dot: '#22c55e', border: 'rgba(34,197,94,0.15)', color: '#22c55e' },
  medium:   { dot: '#eab308', border: 'rgba(234,179,8,0.15)', color: '#eab308' },
  high:     { dot: '#f97316', border: 'rgba(249,115,22,0.15)', color: '#f97316' },
  critical: { dot: '#ef4444', border: 'rgba(239,68,68,0.15)', color: '#ef4444' },
};

const CATEGORY_STYLES = {
  emergency: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
  health:    { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
  traffic:   { bg: 'rgba(249,115,22,0.1)', color: '#f97316' },
  utilities: { bg: 'rgba(168,85,247,0.1)', color: '#a855f7' },
  education: { bg: 'rgba(34,197,94,0.1)', color: '#22c55e' },
  law_order: { bg: 'rgba(71,85,105,0.1)', color: '#64748b' },
  general:   { bg: 'rgba(100,116,139,0.1)', color: '#94a3b8' },
};

export default function TemplatesPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { theme } = useTheme();

  // Local templates state persisting to localStorage
  const [templates, setTemplates] = useState(() => {
    const saved = localStorage.getItem('uacs_templates');
    return saved ? JSON.parse(saved) : DEFAULT_TEMPLATES;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  // Form Fields State
  const [icon, setIcon] = useState('📢');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('general');
  const [urgency, setUrgency] = useState('low');
  const [message, setMessage] = useState('');

  useEffect(() => {
    localStorage.setItem('uacs_templates', JSON.stringify(templates));
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    return templates.filter(tpl => {
      const matchSearch =
        (tpl.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tpl.message || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = activeCategory === 'all' || tpl.category === activeCategory;
      return matchSearch && matchCat;
    });
  }, [templates, searchTerm, activeCategory]);

  const handleUseTemplate = (tpl) => {
    navigate('/compose', {
      state: {
        template: {
          title: tpl.name,
          master_content: tpl.message,
          urgency: tpl.urgency,
        }
      }
    });
    toast.success('Template loaded in composer');
  };

  const handleOpenCreateModal = () => {
    setEditingTemplate(null);
    setIcon('📢');
    setName('');
    setCategory('general');
    setUrgency('low');
    setMessage('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tpl) => {
    setEditingTemplate(tpl);
    setIcon(tpl.icon || '📢');
    setName(tpl.name || '');
    setCategory(tpl.category || 'general');
    setUrgency(tpl.urgency || 'low');
    setMessage(tpl.message || '');
    setIsModalOpen(true);
  };

  const handleSaveTemplate = (e) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      toast.error('Title and message contents are required.');
      return;
    }

    if (editingTemplate) {
      // Edit mode
      setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? {
        ...t, icon, name, category, urgency, message
      } : t));
      toast.success('Template updated successfully');
    } else {
      // Create mode
      const newTpl = {
        id: Date.now(),
        icon, name, category, urgency, message
      };
      setTemplates(prev => [newTpl, ...prev]);
      toast.success('Template created successfully');
    }
    setIsModalOpen(false);
  };

  const handleDeleteTemplate = (id) => {
    if (!window.confirm('Delete this template?')) return;
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast.success('Template deleted');
  };

  const handleResetToDefaults = () => {
    if (!window.confirm('Reset template library to original default list? All custom templates will be overwritten.')) return;
    setTemplates(DEFAULT_TEMPLATES);
    toast.success('Restored default templates');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3">
            <BookTemplate className="w-8 h-8 text-(--accent)" />
            {t('messageTemplates') || 'Message Templates'}
          </h1>
          <p className="text-sm mt-1 text-theme-muted">
            {t('templatesSubtitle') || 'Pre-approved and custom templates for quick alert dispatch.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleResetToDefaults}
            className="px-4 py-2 border rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer bg-transparent border-red-500/20 text-red-500 hover:bg-red-500/5 active:scale-[0.98]"
            title="Restore original templates"
          >
            <RotateCcw className="w-4 h-4" /> Restore Defaults
          </button>
          <button 
            onClick={handleOpenCreateModal}
            className="theme-toggle px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> Create Template
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between glass-card p-4">
        <div className="flex-1 w-full md:max-w-md relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" />
          <input
            type="text"
            placeholder={t('searchTemplates') || 'Search templates by title or content...'}
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
              className="px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors border-0 cursor-pointer"
              style={{
                background: activeCategory === cat.id ? 'var(--accent)' : 'transparent',
                color: activeCategory === cat.id ? 'white' : 'var(--text-secondary)',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTemplates.map((tpl, i) => {
          const us = URGENCY_STYLES[tpl.urgency] || URGENCY_STYLES.low;
          const cs = CATEGORY_STYLES[tpl.category] || CATEGORY_STYLES.general;
          return (
            <div
              key={tpl.id}
              className="glass-card flex flex-col p-5 animate-slide-up hover:shadow-lg transition-shadow duration-300 relative group"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="flex items-center gap-4 border-b border-[var(--border)] pb-4 mb-4">
                <div className="text-4xl filter drop-shadow-sm select-none">{tpl.icon}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-theme-primary truncate">{tpl.name}</h3>
                  <div className="flex gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider"
                      style={{ background: cs.bg, color: cs.color }}>
                      {tpl.category}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider flex items-center gap-1 border"
                      style={{ borderColor: us.border, color: us.color }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: us.dot }} />
                      {tpl.urgency}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 text-sm text-[var(--text-secondary)] leading-relaxed italic mb-4 line-clamp-4">
                "{tpl.message}"
              </div>

              <div className="flex items-center gap-2 mt-auto">
                <button 
                  onClick={() => handleUseTemplate(tpl)} 
                  className="btn-primary flex-1 justify-center py-2 text-xs font-bold"
                >
                  {t('useTemplate') || 'Use Template'}
                </button>
                <button 
                  onClick={() => handleOpenEditModal(tpl)}
                  className="p-2 border border-theme-border rounded-xl hover:bg-theme-hover text-theme-secondary hover:text-theme-primary cursor-pointer active:scale-95 transition-all"
                  title="Edit Template"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDeleteTemplate(tpl.id)}
                  className="p-2 border border-red-500/20 rounded-xl hover:bg-red-500/5 text-red-500 cursor-pointer active:scale-95 transition-all"
                  title="Delete Template"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="glass-card p-12 text-center max-w-md mx-auto">
          <BookTemplate className="w-12 h-12 mx-auto mb-4 text-theme-dim animate-pulse" />
          <h3 className="text-lg font-medium text-theme-secondary mb-2">{t('noTemplatesFound') || 'No templates found'}</h3>
          <p className="text-sm text-theme-muted mb-4">{t('adjustFilters') || 'Try adjusting your search or category filters.'}</p>
          <button onClick={() => { setSearchTerm(''); setActiveCategory('all'); }} className="btn-secondary text-sm">
            {t('clearFilters') || 'Clear Filters'}
          </button>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-10000 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <form 
            onSubmit={handleSaveTemplate}
            className="max-w-lg w-full rounded-3xl border overflow-hidden flex flex-col glass-card"
            style={{
              background: theme === 'light' ? '#faf8f5' : 'linear-gradient(315deg, #000000 0%, #030303 15%, #08080a 30%, #0d0d10 45%, #131316 60%, #17171a 75%, #1e1e22 90%, #242428 100%)',
              borderColor: 'var(--border)'
            }}
          >
            <div className="p-6 border-b border-theme-border relative">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 bg-transparent border-0 cursor-pointer text-theme-muted hover:text-theme-primary"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-black text-theme-primary flex items-center gap-2">
                <BookTemplate className="w-6 h-6 text-(--accent)" />
                {editingTemplate ? 'Edit Template' : 'Create Custom Template'}
              </h2>
              <p className="text-xs text-theme-muted mt-1">
                Design custom alerts and save them for instant dispatch
              </p>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1.5">
                    Icon
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    className="input-field w-full text-center text-xl"
                    value={icon}
                    onChange={e => setIcon(e.target.value)}
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1.5">
                    Template Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field w-full"
                    placeholder="e.g. Earthquake Alert"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1.5">
                    Category
                  </label>
                  <select 
                    className="input-field w-full"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                  >
                    {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1.5">
                    Urgency
                  </label>
                  <select 
                    className="input-field w-full"
                    value={urgency}
                    onChange={e => setUrgency(e.target.value)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1.5">
                  Message Body <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  className="textarea-field w-full h-32 text-sm leading-relaxed"
                  placeholder="Draft the message here... Use [ZONE], [TIME], [DATE], [MAGNITUDE], or [TEMP] placeholders to fill in during dispatch."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />
              </div>
            </div>

            <div className="p-6 border-t border-theme-border flex items-center justify-end gap-3 bg-theme-surface/30">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 border border-theme-border rounded-xl text-xs font-bold hover:bg-theme-hover cursor-pointer active:scale-95 transition-all text-theme-secondary"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="theme-toggle px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer active:scale-[0.98] transition-all shadow-md"
              >
                {editingTemplate ? 'Save Changes' : 'Create Template'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

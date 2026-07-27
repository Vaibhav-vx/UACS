import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookTemplate, Search, Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../ThemeContext';

const DEFAULT_TEMPLATES = [
  // 🚨 CRITICAL URGENCY (10)
  { id: 'tpl-1', name: 'Earthquake Alert', category: 'emergency', urgency: 'critical', message: 'EMERGENCY ALERT: A major earthquake has occurred. Dangerous aftershocks are expected. DROP, COVER, and HOLD ON immediately under a sturdy desk or table. Keep away from windows and outer walls. Do not use elevators. If outdoors, move to an open area away from structures and power lines.' },
  { id: 'tpl-2', name: 'Flood Evacuation', category: 'emergency', urgency: 'critical', message: 'IMMEDIATE EVACUATION ORDER: Severe flooding is imminent. All residents in low-lying areas must evacuate immediately to higher ground. Go to the nearest designated emergency shelter. Do not walk or drive through flood waters. Turn around, don\'t drown.' },
  { id: 'tpl-3', name: 'Gas Leak Emergency', category: 'emergency', urgency: 'critical', message: 'SHELTER-IN-PLACE ORDER: A hazardous gas leak has occurred. Go indoors immediately. Close and lock all windows and exterior doors. Turn off all heating, ventilation, and air conditioning systems. Seal gaps around doors with damp towels. Remain inside until further notice.' },
  { id: 'tpl-4', name: 'Tsunami Evacuation', category: 'emergency', urgency: 'critical', message: 'TSUNAMI WARNING: A series of dangerous waves is approaching. If you are near coastal or low-lying beaches, move inland to high ground immediately. Do not stay to watch the waves. Follow evacuation routes away from the shore.' },
  { id: 'tpl-5', name: 'Tornado Warning', category: 'emergency', urgency: 'critical', message: 'TORNADO WARNING: A tornado has been detected. Take shelter immediately in a basement, cellar, or interior room on the lowest floor. Protect your head with blankets or helmets. Avoid windows and mobile structures.' },
  { id: 'tpl-6', name: 'Nuclear Plant Warning', category: 'emergency', urgency: 'critical', message: 'RADIATION ALERT: An emergency has occurred at the nuclear power facility. Go indoors immediately. Close and seal all windows and doors. Turn off all ventilation and heating systems. Stay tuned to emergency channels for evacuation updates.' },
  { id: 'tpl-7', name: 'Civil Danger Warning', category: 'emergency', urgency: 'critical', message: 'CIVIL DANGER ALERT: A critical threat to public safety has occurred. Take immediate protective action. Avoid public spaces and seek a secure indoor location. Follow directives issued by security personnel.' },
  { id: 'tpl-8', name: 'Active Threat Warning', category: 'law_order', urgency: 'critical', message: 'ACTIVE THREAT WARNING: Law enforcement is responding to an active safety threat. Avoid the area completely. If you are nearby, shelter in a secure room, lock all doors, silence devices, and remain hidden until officially cleared.' },
  { id: 'tpl-9', name: 'Cyclone Warning', category: 'emergency', urgency: 'critical', message: 'CRITICAL WEATHER WARNING: A severe cyclone is approaching. Secure loose outdoor objects, stay indoors away from windows, and remain in the strongest part of your building. Keep emergency kits ready.' },
  { id: 'tpl-10', name: 'Wildfire Evacuation Order', category: 'emergency', urgency: 'critical', message: 'EVACUATION ORDER: A fast-moving wildfire is threatening the area. All residents must evacuate immediately. Grab emergency kits, essential medications, and pets. Leave via designated escape routes. Do not delay evacuation to protect property.' },

  // ⚠️ HIGH URGENCY (7)
  { id: 'tpl-11', name: 'Wildfire Evacuation Watch', category: 'emergency', urgency: 'high', message: 'EVACUATION WATCH: A wildfire is active and threatening the area. All residents must prepare to evacuate at a moment\'s notice. Pack emergency kits, essential medications, and prepare pets. Follow instructions from emergency personnel.' },
  { id: 'tpl-12', name: 'Extreme Heat Warning', category: 'health', urgency: 'high', message: 'HEALTH ADVISORY: An extreme heatwave is active with dangerously high temperatures. Avoid strenuous outdoor activities between 11:00 AM and 4:00 PM. Stay in air-conditioned spaces, drink plenty of water, and check on elderly neighbors and pets.' },
  { id: 'tpl-13', name: 'Air Quality Emergency', category: 'health', urgency: 'high', message: 'HEALTH ADVISORY: Poor air quality index readings have reached unhealthy levels. Sensitive groups, including children, the elderly, and individuals with respiratory conditions, must limit outdoor exposure and avoid heavy exertion.' },
  { id: 'tpl-14', name: 'Blizzard Warning', category: 'emergency', urgency: 'high', message: 'WINTER WEATHER EMERGENCY: A severe blizzard is causing zero visibility and freezing conditions. Stay indoors and avoid all travel. If heating fails, gather in a central room, wear multiple layers, and avoid using unvented indoor heaters.' },
  { id: 'tpl-15', name: 'Avalanche Warning', category: 'emergency', urgency: 'high', message: 'AVALANCHE WARNING: Unstable snowpack conditions have triggered severe avalanche warnings. Avoid all travel on backcountry slopes, mountain trails, and designated hazard zones. Outdoor recreationists must seek lower elevation safety.' },
  { id: 'tpl-16', name: 'Child Abduction Alert', category: 'law_order', urgency: 'high', message: 'CHILD ABDUCTION EMERGENCY: A child has been reported abducted. Check local public notices and media channels for description details of the victim, suspect, and suspect vehicle. If you have any information, contact authorities immediately.' },
  { id: 'tpl-17', name: 'Heavy Rain & Landslide Watch', category: 'emergency', urgency: 'high', message: 'HEAVY RAIN WARNING: Continuous rainfall is triggering severe landslide risks. Residents near steep slopes must prepare for immediate evacuation. Avoid mountain transit routes.' },

  // ⚡ MEDIUM URGENCY (8)
  { id: 'tpl-18', name: 'Landslide Warning', category: 'emergency', urgency: 'medium', message: 'LANDSLIDE WATCH: Heavy rainfall has saturated slopes, creating a potential landslide hazard. If you are near steep hillsides or slopes, remain vigilant and be prepared to evacuate if slope movement is observed.' },
  { id: 'tpl-19', name: 'Severe Thunderstorm Warning', category: 'emergency', urgency: 'medium', message: 'SEVERE WEATHER WARNING: High winds, large hail, and frequent lightning strikes are occurring. Move indoors immediately. Stay away from windows, avoid using corded electrical appliances, and do not touch running water.' },
  { id: 'tpl-20', name: 'Roadway Closure', category: 'traffic', urgency: 'medium', message: 'TRAFFIC ADVISORY: A major traffic incident has blocked primary transit lanes. Major delays are expected. Commuters must seek alternate routes and follow local detours established by response personnel.' },
  { id: 'tpl-21', name: 'Dense Fog Advisory', category: 'traffic', urgency: 'medium', message: 'DENSE FOG ADVISORY: Visibility is reduced to near-zero on major roadways. Drivers are urged to reduce speeds, maintain safe following distances, and use low-beam headlights.' },
  { id: 'tpl-22', name: 'Localized Power Outage', category: 'utilities', urgency: 'medium', message: 'POWER GRID ADVISORY: Localized electrical outages are affecting parts of the area. Service restoration crews are active. Avoid contact with downed power lines.' },
  { id: 'tpl-23', name: 'Volcanic Ash Advisory', category: 'emergency', urgency: 'medium', message: 'VOLCANIC ASH ADVISORY: Significant volcanic ash fall is expected. Stay indoors with doors and windows closed. Wear masks and goggles if you must go outside. Avoid operating combustion engines.' },
  { id: 'tpl-24', name: 'Boil Water Advisory', category: 'health', urgency: 'medium', message: 'HEALTH ADVISORY: Contamination has been detected in the public drinking water system. All consumers must boil water vigorously for at least one minute before drinking, cooking, brushing teeth, or washing dishes.' },
  { id: 'tpl-25', name: 'Marine Storm Warning', category: 'emergency', urgency: 'medium', message: 'MARINE WARNING: Severe storm conditions are causing dangerous coastal swells, high winds, and hazardous seas. All small vessels must return to port immediately. Recreational water activities are suspended.' },

  // 📢 LOW URGENCY (5)
  { id: 'tpl-26', name: 'Water Disruption Advisory', category: 'utilities', urgency: 'low', message: 'PUBLIC ADVISORY: Maintenance of the water supply network is underway. Water service may experience low pressure or temporary disruption. Residents are advised to store water for basic needs.' },
  { id: 'tpl-27', name: 'Scheduled Grid Maintenance', category: 'utilities', urgency: 'low', message: 'UTILITY ADVISORY: Scheduled maintenance on communications systems is planned. Brief, intermittent network outages may occur during this timeframe.' },
  { id: 'tpl-28', name: 'School Closure Notice', category: 'education', urgency: 'low', message: 'SCHOOL CLOSURE NOTICE: All schools and educational facilities will remain closed today due to severe weather. Virtual classes will proceed where scheduled.' },
  { id: 'tpl-29', name: 'Public Briefing Announcement', category: 'general', urgency: 'low', message: 'INFORMATION BULLETIN: The municipal emergency preparedness briefing will be broadcast live. Residents are invited to watch the feed online or on local access channels.' },
  { id: 'tpl-30', name: 'Community Preparedness Notice', category: 'general', urgency: 'low', message: 'COMMUNITY NOTICE: Help keep our community safe by winterizing homes, checking smoke alarms, and reviewing family emergency plans. Contact local offices for free guide booklets.' }
];

const CATEGORIES = [
  { id: 'all', labelKey: 'allCategories', label: 'All Categories' },
  { id: 'emergency', labelKey: 'emergency', label: 'Emergency' },
  { id: 'health', labelKey: 'health', label: 'Health' },
  { id: 'traffic', labelKey: 'traffic', label: 'Traffic' },
  { id: 'utilities', labelKey: 'utilities', label: 'Utilities' },
  { id: 'education', labelKey: 'education', label: 'Education' },
  { id: 'law_order', labelKey: 'lawOrder', label: 'Law & Order' },
  { id: 'general', labelKey: 'general', label: 'General' },
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
  const { theme } = useTheme();

  const [templates, setTemplates] = useState(() => {
    const version = localStorage.getItem('uacs_templates_version');
    const saved = localStorage.getItem('uacs_custom_templates');
    if (version !== 'v6') {
      localStorage.setItem('uacs_templates_version', 'v6');
      localStorage.setItem('uacs_custom_templates', JSON.stringify(DEFAULT_TEMPLATES));
      return DEFAULT_TEMPLATES;
    }
    return saved ? JSON.parse(saved) : DEFAULT_TEMPLATES;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);

  // Form State
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('emergency');
  const [newUrgency, setNewUrgency] = useState('critical');
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    localStorage.setItem('uacs_custom_templates', JSON.stringify(templates));
  }, [templates]);

  const handleCreateTemplate = (e) => {
    e.preventDefault();
    if (!newName.trim() || !newMessage.trim()) {
      toast.error('Please enter both name and template message content');
      return;
    }

    const newTpl = {
      id: `tpl-${Date.now()}`,
      name: newName,
      category: newCategory,
      urgency: newUrgency,
      message: newMessage,
    };

    setTemplates([newTpl, ...templates]);
    toast.success('Custom template created successfully');
    
    // Reset Form
    setNewName('');
    setNewMessage('');
    setIsCreatorOpen(false);
  };

  const handleDeleteTemplate = (id, name) => {
    if (window.confirm(`Delete the template "${name}" permanently?`)) {
      setTemplates(templates.filter(t => t.id !== id));
      toast.success('Template deleted');
    }
  };

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
    toast.success(t('templateLoaded') || 'Template loaded in composer');
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter(tpl => {
      const matchSearch =
        tpl.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tpl.message.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = activeCategory === 'all' || tpl.category === activeCategory;
      return matchSearch && matchCat;
    });
  }, [templates, searchTerm, activeCategory]);

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3">
            <BookTemplate className="w-8 h-8 text-accent" />
            {t('messageTemplates') || 'Message Templates'}
          </h1>
          <p className="text-sm mt-1 text-theme-muted">
            {t('templatesSubtitle') || 'Pre-approved alerts and templates for rapid disaster dispatch.'}
          </p>
        </div>
        <button
          onClick={() => setIsCreatorOpen(!isCreatorOpen)}
          className="btn-primary px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform"
        >
          {isCreatorOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isCreatorOpen ? 'Cancel' : 'Create Custom Template'}
        </button>
      </div>

      {/* Slide-Down Template Creator Form */}
      {isCreatorOpen && (
        <form 
          onSubmit={handleCreateTemplate}
          className="p-6 rounded-3xl border animate-slide-down space-y-4"
          style={{
            background: theme === 'light' ? '#faf8f5' : 'linear-gradient(315deg, #000000 0%, #030303 15%, #08080a 30%, #0d0d10 45%, #131316 60%, #17171a 75%, #1e1e22 90%, #242428 100%)',
            borderColor: theme === 'light' ? 'rgba(145, 99, 203, 0.18)' : 'rgba(79, 89, 112, 0.25)',
            boxShadow: theme === 'light' ? '0 12px 24px -10px rgba(80, 45, 85, 0.08)' : '0 20px 40px -15px rgba(0,0,0,0.5)'
          }}
        >
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Plus className="w-5 h-5 text-accent" /> Build New Custom Template
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1.5">Template Title</label>
              <input
                type="text"
                placeholder="e.g. Chemical Leak Alert"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="input-field w-full"
                maxLength={50}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1.5">Category</label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="input-field w-full"
              >
                {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1.5">Urgency Level</label>
              <select
                value={newUrgency}
                onChange={e => setNewUrgency(e.target.value)}
                className="input-field w-full"
              >
                <option value="low">Green (Low)</option>
                <option value="medium">Yellow (Medium)</option>
                <option value="high">Orange (High)</option>
                <option value="critical">Red (Critical)</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1.5">
                Template Message Content
              </label>
              <textarea
                placeholder="Write the emergency instructions clearly..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                className="textarea-field w-full h-20"
                maxLength={400}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreatorOpen(false)}
              className="btn-secondary px-4 py-2"
            >
              Discard
            </button>
            <button
              type="submit"
              className="btn-primary px-6 py-2"
            >
              Save Template
            </button>
          </div>
        </form>
      )}

      {/* Filter Options */}
      <div 
        className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between p-4 rounded-3xl border"
        style={{
          background: theme === 'light' ? '#faf8f5' : 'linear-gradient(315deg, #000000 0%, #030303 15%, #08080a 30%, #0d0d10 45%, #131316 60%, #17171a 75%, #1e1e22 90%, #242428 100%)',
          borderColor: theme === 'light' ? 'rgba(145, 99, 203, 0.18)' : 'rgba(79, 89, 112, 0.25)',
        }}
      >
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

        <div className="flex gap-1.5 p-1 rounded-xl bg-black/10 border border-theme-border overflow-x-auto w-full md:w-auto scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer"
              style={{
                background: activeCategory === cat.id 
                  ? (theme === 'light' ? 'linear-gradient(135deg, #dec9e9 0%, #dac3e8 30%, #d2b7e5 70%, #c19ee0 100%)' : 'linear-gradient(315deg, #000000 0%, #030303 15%, #08080a 30%, #0d0d10 45%, #131316 60%, #17171a 75%, #1e1e22 90%, #242428 100%)')
                  : 'transparent',
                color: activeCategory === cat.id ? (theme === 'light' ? '#1e082b' : '#ffffff') : 'var(--text-secondary)',
                border: activeCategory === cat.id ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent',
              }}
            >
              {t(cat.labelKey) || cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTemplates.map((tpl, i) => {
          const name = tpl.name;
          const msg  = tpl.message;
          const us   = URGENCY_STYLES[tpl.urgency];
          const cs   = CATEGORY_STYLES[tpl.category];
          
          return (
            <div
              key={tpl.id}
              className="flex flex-col p-5 rounded-3xl border transition-all hover:scale-[1.02] duration-300"
              style={{ 
                animationDelay: `${i * 40}ms`,
                background: theme === 'light' ? '#faf8f5' : 'linear-gradient(315deg, #000000 0%, #030303 15%, #08080a 30%, #0d0d10 45%, #131316 60%, #17171a 75%, #1e1e22 90%, #242428 100%)',
                borderColor: theme === 'light' ? 'rgba(145, 99, 203, 0.18)' : 'rgba(79, 89, 112, 0.25)',
                boxShadow: theme === 'light' ? '0 8px 16px -8px rgba(80, 45, 85, 0.05)' : 'inset 0 1px 0 rgba(255,255,255,0.02)'
              }}
            >
              <div className="flex items-start gap-3 border-b border-theme-border pb-4 mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base text-theme-primary truncate">{name}</h3>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wider"
                      style={{ background: cs.bg, color: cs.color }}>
                      {tpl.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wider flex items-center gap-1 border"
                      style={{ borderColor: us.border, color: us.color }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: us.dot }} />
                      {tpl.urgency}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 text-xs text-theme-secondary leading-relaxed italic mb-4">
                "{msg.length > 140 ? msg.substring(0, 140) + '...' : msg}"
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleUseTemplate(tpl)} 
                  className="btn-primary flex-1 justify-center py-2 text-xs font-bold"
                >
                  Use Template
                </button>
                <button
                  onClick={() => handleDeleteTemplate(tpl.id, tpl.name)}
                  className="p-2 border border-red-500/25 text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
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
        <div 
          className="p-12 text-center rounded-3xl border border-dashed"
          style={{
            background: theme === 'light' ? '#faf8f5' : 'linear-gradient(315deg, #000000 0%, #030303 15%, #08080a 30%, #0d0d10 45%, #131316 60%, #17171a 75%, #1e1e22 90%, #242428 100%)',
            borderColor: theme === 'light' ? 'rgba(145, 99, 203, 0.25)' : 'rgba(79, 89, 112, 0.35)',
          }}
        >
          <BookTemplate className="w-12 h-12 mx-auto mb-4 text-theme-dim" />
          <h3 className="text-lg font-bold text-theme-secondary mb-2">{t('noTemplatesFound') || 'No templates found'}</h3>
          <p className="text-sm text-theme-muted mb-4">{t('adjustFilters') || 'Try adjusting your search or category filters.'}</p>
          <button onClick={() => { setSearchTerm(''); setActiveCategory('all'); }} className="btn-secondary text-sm">
            {t('clearFilters') || 'Clear Filters'}
          </button>
        </div>
      )}
    </div>
  );
}

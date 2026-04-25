import { useState, useEffect, useMemo } from 'react';
import { 
  ScrollText, Download, Filter, RefreshCw, Search, ChevronDown, ChevronRight,
  X, Calendar, Trash2, MessageSquare, User, Clock, Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import { auditApi } from '../api';
import { useLanguage } from '../i18n/LanguageContext';

const ACTION_COLORS = { 
  created: { bg:'rgba(59,130,246,0.15)', color:'#3b82f6' }, 
  approved: { bg:'rgba(34,197,94,0.15)', color:'#22c55e' }, 
  dispatched: { bg:'rgba(168,85,247,0.15)', color:'#a855f7' }, 
  expired: { bg:'rgba(239,68,68,0.15)', color:'#ef4444' }, 
  edited: { bg:'rgba(234,179,8,0.15)', color:'#eab308' },
  rejected: { bg:'rgba(239,68,68,0.15)', color:'#ef4444' }
};

export default function AuditLogPage() {
  const { t } = useLanguage();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showClearMenu, setShowClearMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [filters, setFilters] = useState({ action:'', channel:'', performed_by:'', date_from:'', date_to:'' });

  const fetchEntries = async () => { 
    setLoading(true); 
    try { 
      const active = {}; 
      Object.entries(filters).forEach(([k,v]) => { if(v) active[k] = v; }); 
      const r = await auditApi.getAll(active); 
      setEntries(r.data); 
    } catch { 
      toast.error(t('failedLoad') || 'Failed to load audit logs'); 
    } finally { 
      setLoading(false); 
    } 
  };

  useEffect(() => { fetchEntries(); }, []);

  // Group entries by message_id
  const groupedEntries = useMemo(() => {
    const groups = {};
    entries.forEach(entry => {
      const mid = entry.message_id || 'system';
      if (!groups[mid]) {
        groups[mid] = {
          id: mid,
          title: entry.message_title || (mid === 'system' ? 'System Actions' : `Message #${mid}`),
          logs: [],
          latestAction: entry.action,
          latestTimestamp: entry.timestamp,
          performedBy: entry.performed_by
        };
      }
      groups[mid].logs.push(entry);
      // Update latest if this entry is newer
      if (new Date(entry.timestamp) > new Date(groups[mid].latestTimestamp)) {
        groups[mid].latestAction = entry.action;
        groups[mid].latestTimestamp = entry.timestamp;
        groups[mid].performedBy = entry.performed_by;
      }
    });
    return Object.values(groups).sort((a, b) => new Date(b.latestTimestamp) - new Date(a.latestTimestamp));
  }, [entries]);

  const toggleExpand = (id) => {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
  };

  const clearFilters = () => { 
    setFilters({ action:'', channel:'', performed_by:'', date_from:'', date_to:'' }); 
    setTimeout(fetchEntries, 0); 
  };

  const handleExport = async () => { 
    setExporting(true); 
    try { 
      const active = {}; 
      Object.entries(filters).forEach(([k,v]) => { if(v) active[k] = v; }); 
      const r = await auditApi.exportCsv(active); 
      const url = window.URL.createObjectURL(new Blob([r.data])); 
      const link = document.createElement('a'); 
      link.href = url; 
      link.setAttribute('download', `uacs-audit-${new Date().toISOString().split('T')[0]}.csv`); 
      document.body.appendChild(link); 
      link.click(); 
      link.remove(); 
      window.URL.revokeObjectURL(url); 
      toast.success(t('csvExported') || 'Exported successfully'); 
    } catch { 
      toast.error(t('exportFailed') || 'Export failed'); 
    } finally { 
      setExporting(false); 
    } 
  };

  const handleClear = async (days) => { 
    if (!window.confirm(`Delete all audit entries older than ${days} days? This cannot be undone.`)) return; 
    setClearing(true); 
    setShowClearMenu(false); 
    try { 
      const r = await auditApi.clearOld(days); 
      toast.success(`Cleared ${r.data.deleted} entries older than ${days} days`); 
      fetchEntries(); 
    } catch(err) { 
      toast.error('Clear failed: ' + (err.response?.data?.error || err.message)); 
    } finally { 
      setClearing(false); 
    } 
  };

  const hasActive = Object.values(filters).some(v => v);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <ScrollText className="w-6 h-6" style={{color:'var(--accent)'}}/> {t('auditTitle')}
          </h1>
          <p className="text-sm mt-1 text-theme-muted">{t('auditSubtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchEntries} className="btn-secondary text-sm">
            <RefreshCw className="w-4 h-4"/> {t('refresh') || 'Refresh'}
          </button>
          <button onClick={() => setShowFilters(!showFilters)} className="btn-secondary text-sm" style={hasActive ? {borderColor:'var(--accent-border)',color:'var(--accent)'} : {}}>
            <Filter className="w-4 h-4"/> {t('filters') || 'Filters'} {hasActive && <span className="w-2 h-2 rounded-full" style={{background:'var(--accent)'}}/>}
          </button>
          <button onClick={handleExport} disabled={exporting} className="btn-primary text-sm">
            {exporting ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4"/>} {t('exportCSV') || 'Export CSV'}
          </button>
          <div style={{position:'relative'}}>
            <button onClick={() => setShowClearMenu(v => !v)} disabled={clearing} className="btn-secondary text-sm" style={{borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444'}}>
              {clearing ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>} {t('clearOld') || 'Clear Old'}
            </button>
            {showClearMenu && (
              <div className="animate-fade-in" style={{position:'absolute',right:0,top:'100%',marginTop:4,minWidth:180,borderRadius:10,background:'var(--bg-surface)',border:'1px solid var(--border)',boxShadow:'var(--shadow-lg)',zIndex:50,overflow:'hidden'}}>
                <p style={{fontSize:11,color:'var(--text-muted)',padding:'8px 12px 4px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>{t('deleteEntriesOlderThan') || 'Delete entries older than'}</p>
                {[7,30,90].map(days => (
                  <button key={days} onClick={() => handleClear(days)} style={{width:'100%',textAlign:'left',padding:'9px 14px',fontSize:13,background:'transparent',color:'#ef4444',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:8}} onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.08)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <Trash2 style={{width:13,height:13}}/> {days} {t('daysLabel') || 'days'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="glass-card p-5 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-theme-secondary">{t('filterAudit')}</h3>
            {hasActive && <button onClick={clearFilters} className="text-xs text-theme-muted flex items-center gap-1" style={{background:'none',border:'none',cursor:'pointer'}}><X className="w-3 h-3"/> {t('clearAll')}</button>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-xs text-theme-muted mb-1 block">{t('action')}</label>
              <div className="relative">
                <select value={filters.action} onChange={e => setFilters(p => ({...p,action:e.target.value}))} className="input-field text-sm appearance-none pr-8">
                  <option value="">{t('allActions')}</option>
                  <option value="created">{t('created')}</option>
                  <option value="approved">{t('approved')}</option>
                  <option value="dispatched">{t('dispatched')}</option>
                  <option value="expired">{t('expired')}</option>
                  <option value="edited">{t('edited')}</option>
                  <option value="rejected">{t('rejected') || 'Rejected'}</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-theme-muted"/>
              </div>
            </div>
            <div>
              <label className="text-xs text-theme-muted mb-1 block">{t('channel')}</label>
              <div className="relative">
                <select value={filters.channel} onChange={e => setFilters(p => ({...p,channel:e.target.value}))} className="input-field text-sm appearance-none pr-8">
                  <option value="">{t('allChannels')}</option>
                  <option value="sms">{t('sms')}</option>
                  <option value="twitter">{t('twitter')}</option>
                  <option value="radio">{t('radio')}</option>
                  <option value="tv">{t('tv')}</option>
                  <option value="website">{t('website')}</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-theme-muted"/>
              </div>
            </div>
            <div>
              <label className="text-xs text-theme-muted mb-1 block">{t('performedBy')}</label>
              <input type="text" value={filters.performed_by} onChange={e => setFilters(p => ({...p,performed_by:e.target.value}))} placeholder={t('searchPlaceholder')} className="input-field text-sm"/>
            </div>
            <div>
              <label className="text-xs text-theme-muted mb-1 block">{t('from')}</label>
              <input type="date" value={filters.date_from} onChange={e => setFilters(p => ({...p,date_from:e.target.value}))} className="input-field text-sm"/>
            </div>
            <div>
              <label className="text-xs text-theme-muted mb-1 block">{t('to')}</label>
              <input type="date" value={filters.date_to} onChange={e => setFilters(p => ({...p,date_to:e.target.value}))} className="input-field text-sm"/>
            </div>
          </div>
          <div className="mt-4 flex justify-end"><button onClick={fetchEntries} className="btn-primary text-sm"><Search className="w-4 h-4"/> {t('apply')}</button></div>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="glass-card p-5 h-20 shimmer rounded-xl"/>)}</div>
        ) : groupedEntries.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <ScrollText className="w-12 h-12 mx-auto mb-4 text-theme-dim"/>
            <h3 className="text-lg font-medium text-theme-secondary mb-2">{t('noAuditEntries')}</h3>
            <p className="text-sm text-theme-muted">{hasActive ? t('noFilterMatch') : t('noAuditDesc')}</p>
          </div>
        ) : groupedEntries.map((group, idx) => {
          const isExpanded = expandedIds.has(group.id);
          const ac = ACTION_COLORS[group.latestAction] || {bg:'var(--bg-hover)',color:'var(--text-muted)'};
          
          return (
            <div key={group.id} className="glass-card overflow-hidden transition-all duration-300 hover:shadow-xl border-0 shadow-lg animate-slide-up" style={{ animationDelay: `${idx * 40}ms` }}>
              <div 
                onClick={() => toggleExpand(group.id)}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-theme-hover transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-theme-hover min-w-[50px]">
                    {group.id === 'system' ? <Shield className="w-5 h-5 text-theme-dim" /> : <MessageSquare className="w-5 h-5 text-accent" />}
                    <span className="text-[10px] font-bold text-theme-dim mt-1">{group.logs.length}x</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-lg text-theme-primary truncate">{group.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-theme-muted mt-1">
                      <span className="flex items-center gap-1"><User className="w-3 h-3"/> {group.performedBy || 'System'}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {new Date(group.latestTimestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-theme-dim">Latest:</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider" style={{background:ac.bg, color:ac.color}}>
                      {group.latestAction}
                    </span>
                  </div>
                  {isExpanded ? <ChevronDown className="w-5 h-5 text-theme-dim" /> : <ChevronRight className="w-5 h-5 text-theme-dim" />}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-theme-border bg-theme-hover/20 animate-fade-in">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-theme-hover/40 text-[10px] uppercase tracking-widest font-bold text-theme-dim">
                          <th className="px-5 py-3 text-left w-48">{t('timestamp')}</th>
                          <th className="px-5 py-3 text-left w-32">{t('action')}</th>
                          <th className="px-5 py-3 text-left w-40">{t('performedBy')}</th>
                          <th className="px-5 py-3 text-left w-24">{t('channel')}</th>
                          <th className="px-5 py-3 text-left">{t('notes')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.logs.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).map((log, i) => {
                          const logAc = ACTION_COLORS[log.action] || {bg:'var(--bg-hover)',color:'var(--text-muted)'};
                          return (
                            <tr key={log.id} className="border-t border-theme-border/50 hover:bg-theme-hover/50 transition-colors">
                              <td className="px-5 py-4 whitespace-nowrap text-xs text-theme-secondary">
                                <div className="flex items-center gap-2"><Calendar className="w-3 h-3 text-accent" /> {new Date(log.timestamp).toLocaleString()}</div>
                              </td>
                              <td className="px-5 py-4">
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter" style={{background:logAc.bg,color:logAc.color}}>
                                  {log.action}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-xs font-medium text-theme-primary">{log.performed_by || '—'}</td>
                              <td className="px-5 py-4 text-[10px] font-bold uppercase text-theme-dim">{log.channel || '—'}</td>
                              <td className="px-5 py-4 text-xs text-theme-muted italic">"{log.notes || '—'}"</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {!loading && groupedEntries.length > 0 && (
        <p className="text-xs text-theme-dim text-right mt-6">
          {t('showingGroups') || 'Grouped by'} {groupedEntries.length} {t('uniqueAlerts') || 'Unique Alerts'} ({entries.length} total events)
        </p>
      )}
    </div>
  );
}

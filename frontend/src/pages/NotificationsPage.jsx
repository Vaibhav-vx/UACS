import { useState, useEffect } from 'react';
import { 
  History, Search, Filter, Calendar, Clock, ArrowRight, 
  CheckCircle, AlertTriangle, Info, Eye, Download, FileText,
  ChevronRight
} from 'lucide-react';
import { messagesApi } from '../api';
import AlertBanner from '../components/AlertBanner';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, critical, active, expired

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const [active, expired] = await Promise.all([
          messagesApi.getAll('active'),
          messagesApi.getAll('expired')
        ]);
        setAlerts([...active.data, ...expired.data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      } catch (e) {
        toast.error("Failed to load history");
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  const filteredAlerts = alerts.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase()) || 
                         a.master_content.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || 
                         (filter === 'critical' && a.urgency === 'critical') ||
                         (filter === 'active' && a.status === 'active') ||
                         (filter === 'expired' && a.status === 'expired');
    return matchesSearch && matchesFilter;
  });

  const groupedAlerts = filteredAlerts.reduce((groups, alert) => {
    const date = new Date(alert.created_at).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
    if (!groups[date]) groups[date] = [];
    groups[date].push(alert);
    return groups;
  }, {});

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-fade-in">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-3">
            <History className="w-7 h-7 text-accent" />
            Alert History & Notifications
          </h1>
          <p className="text-sm text-theme-muted">Track all received emergency communications and your responses.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-theme-hover rounded-xl text-xs font-bold hover:bg-accent hover:text-white transition-all shadow-lg">
          <Download className="w-4 h-4" /> EXPORT PDF
        </button>
      </div>

      {/* Filters Bar */}
      <div className="glass-card p-2 rounded-2xl flex flex-wrap items-center gap-2 border-theme-border shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-dim" />
          <input 
            type="text" 
            placeholder="Search alerts by keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-theme-surface border border-theme-border rounded-xl text-sm focus:border-accent outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-1 p-1 bg-theme-surface border border-theme-border rounded-xl">
           {['all', 'critical', 'active', 'expired'].map(f => (
             <button 
               key={f}
               onClick={() => setFilter(f)}
               className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${filter === f ? 'bg-accent text-white shadow-md' : 'text-theme-muted hover:bg-theme-hover'}`}
             >
               {f}
             </button>
           ))}
        </div>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-32 glass-card shimmer rounded-3xl" />)}
        </div>
      ) : Object.keys(groupedAlerts).length === 0 ? (
        <div className="text-center py-20 glass-card rounded-3xl">
          <Clock className="w-16 h-16 mx-auto mb-4 text-theme-dim" />
          <h3 className="text-xl font-bold text-theme-secondary">No Alerts Found</h3>
          <p className="text-theme-muted">We couldn't find any alerts matching your current filters.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedAlerts).map(([date, items]) => (
            <div key={date} className="space-y-4">
              <div className="flex items-center gap-4">
                <h2 className="text-xs font-black text-theme-dim uppercase tracking-[0.2em] whitespace-nowrap">{date}</h2>
                <div className="h-px w-full bg-theme-border" />
              </div>
              <div className="space-y-4">
                {items.map((alert) => (
                  <div key={alert.id} className="glass-card overflow-hidden rounded-2xl border-0 shadow-lg hover:shadow-2xl transition-all group">
                    <div className="flex flex-col md:flex-row">
                       <div className="w-1 bg-accent group-hover:w-2 transition-all shrink-0" style={{ backgroundColor: alert.urgency === 'critical' ? '#ef4444' : alert.urgency === 'high' ? '#f97316' : 'var(--accent)' }} />
                       <div className="p-5 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="space-y-3">
                             <div className="flex items-center gap-3">
                                <AlertBanner urgency={alert.urgency} />
                                <h3 className="font-bold text-lg">{alert.title}</h3>
                             </div>
                             <p className="text-sm text-theme-secondary line-clamp-1">{alert.master_content}</p>
                             <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-theme-muted uppercase tracking-wider">
                                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Received: {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Response: Marked Safe</span>
                                <span className={`px-2 py-0.5 rounded ${alert.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-theme-hover text-theme-dim'}`}>
                                   Status: {alert.status}
                                </span>
                             </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                             <button className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-theme-hover border border-theme-border text-xs font-bold hover:border-accent transition-all flex items-center justify-center gap-2">
                                <Eye className="w-3.5 h-3.5" /> Full Alert
                             </button>
                             {alert.status === 'active' && (
                               <button className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-accent text-white text-xs font-black shadow-lg shadow-accent/20 animate-pulse flex items-center justify-center gap-2">
                                  Respond Now <ArrowRight className="w-3.5 h-3.5" />
                               </button>
                             )}
                          </div>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

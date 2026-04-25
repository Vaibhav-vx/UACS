import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, Clock, AlertTriangle, CheckCircle, Send, Timer, RefreshCw, Eye, RotateCcw, 
  Zap, TrendingUp, X, PenSquare, MapPin, Globe, Shield, Info, Activity as SafetyIcon,
  Navigation, Heart, History, BarChart3, CloudRain
} from 'lucide-react';
import toast from 'react-hot-toast';
import { messagesApi, authApi, recipientsApi } from '../api';
import { useLanguage } from '../i18n/LanguageContext';
import ExpiryTimer from '../components/ExpiryTimer';
import ChannelBadge from '../components/ChannelBadge';
import AlertBanner from '../components/AlertBanner';
import SituationMapCard from '../components/SituationMapCard';
import { EAPS, ZONE_COORDS } from '../constants';

export default function DashboardPage() {
  const [activeMessages, setActiveMessages]   = useState([]);
  const [expiredMessages, setExpiredMessages]  = useState([]);
  const [draftMessages, setDraftMessages]      = useState([]);
  const [stats, setStats]      = useState({ totalToday: 0, active: 0, expiringSoon: 0, expired: 0 });
  const [activeTab, setActiveTab]              = useState('active');
  const [loading, setLoading]                  = useState(true);
  const [actionLoading, setActionLoading]      = useState({});
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [safetyStats, setSafetyStats] = useState({ safe: 0, assistance: 0 });
  const [recentReports, setRecentReports] = useState([]);
  const [emergencyText, setEmergencyText] = useState('');
  const [emergencyZone, setEmergencyZone] = useState('');
  const [emergencyError, setEmergencyError] = useState('');
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [citizenStats, setCitizenStats] = useState({ count: 0, safeToday: 0 });
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('uacs_user') || '{}'));
  const isAdmin = user.role?.toLowerCase() === 'admin';

  const fetchData = useCallback(async () => {
    try {
      const [a, e, d, s] = await Promise.all([
        messagesApi.getAll('active'),
        messagesApi.getAll('expired'),
        messagesApi.getAll('draft'),
        messagesApi.getStats(),
      ]);
      setActiveMessages(a.data);
      setExpiredMessages(e.data);
      setDraftMessages(d.data);
      setStats(s.data);

      if (isAdmin) {
        const [safStats, safRecent] = await Promise.all([
          messagesApi.getSafetyStats(),
          messagesApi.getRecentSafety(),
        ]);
        setSafetyStats(safStats.data);
        setRecentReports(safRecent.data);
      }

      // Fetch Citizen Stats for User View
      if (!isAdmin) {
        const userZone = localStorage.getItem('uacs_pref_zone') || 'General';
        const [rec, saf] = await Promise.all([
          recipientsApi.getAll(userZone),
          messagesApi.getSafetyStats()
        ]);
        setCitizenStats({
          count: rec.data.length,
          safeToday: saf.data.total_safe || 0
        });
      }
    } catch (err) {
      console.error('[DASHBOARD] Fetch error:', err);
      const msg = err.response?.data?.error || err.message || 'Connection failed';
      toast.error(`${t('failedFetch') || 'Failed to load data'}: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [t, isAdmin]);

  useEffect(() => { fetchData(); const iv = setInterval(fetchData, 30000); return () => clearInterval(iv); }, [fetchData]);

  const handleExpireNow = async (id) => {
    setActionLoading(p => ({ ...p, [`e-${id}`]: true }));
    try { await messagesApi.expire(id); toast.success(t('messageExpired') || 'Message expired'); fetchData(); }
    catch { toast.error(t('failedExpire') || 'Failed to expire'); } finally { setActionLoading(p => ({ ...p, [`e-${id}`]: false })); }
  };
  const handleExtend = async (id) => {
    setActionLoading(p => ({ ...p, [`x-${id}`]: true }));
    try { await messagesApi.extend(id, new Date(Date.now() + 86400000).toISOString()); toast.success(t('extendedBy24') || 'Extended by 24h'); fetchData(); }
    catch { toast.error(t('failedExtend') || 'Failed to extend'); } finally { setActionLoading(p => ({ ...p, [`x-${id}`]: false })); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this message? This cannot be undone.')) return;
    setActionLoading(p => ({ ...p, [`d-${id}`]: true }));
    try { await messagesApi.delete(id); toast.success('Message deleted'); fetchData(); }
    catch { toast.error('Failed to delete message'); } finally { setActionLoading(p => ({ ...p, [`d-${id}`]: false })); }
  };

  const handleEmergencySubmit = async () => {
    if (!emergencyText.trim() || !emergencyZone.trim()) {
      setEmergencyError('Both message and target zone are required');
      return;
    }
    setEmergencyError('');
    setEmergencyLoading(true);
    try {
      await messagesApi.emergency({ master_content: emergencyText, target_zone: emergencyZone });
      setIsEmergencyModalOpen(false);
      setEmergencyText('');
      setEmergencyZone('');
      toast.success(t('emergencySent') || '🚨 Emergency broadcast sent to all channels', {
        style: { background: '#ef4444', color: '#fff' },
        iconTheme: { primary: '#fff', secondary: '#ef4444' }
      });
      fetchData();
    } catch (err) {
      setEmergencyError(err.response?.data?.error || err.message);
    } finally {
      setEmergencyLoading(false);
    }
  };

  const Stat = ({ icon: Icon, label, value, color, trend }) => (
    <div className="stat-card animate-slide-up">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider font-medium text-theme-muted">{label}</span>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="text-3xl font-bold mt-1">{value}</div>
      {trend && <div className="text-[10px] text-green-500 mt-1">{trend}</div>}
    </div>
  );

  if (loading) return (<div className="space-y-6"><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i=><div key={i} className="glass-card p-5 h-24 shimmer rounded-xl"/>)}</div><div className="space-y-3">{[1,2,3].map(i=><div key={i} className="glass-card p-6 h-32 shimmer rounded-xl"/>)}</div></div>);

  if (!isAdmin) {
    const userZone = localStorage.getItem('uacs_pref_zone') || 'General';
    const myAlerts = activeMessages.filter(msg => {
      if (userZone === 'General') return true;
      if (!msg.target_zone || msg.target_zone === 'All' || msg.target_zone === 'General') return true;
      return msg.target_zone === userZone;
    });
    const nearbyAlerts = activeMessages.filter(msg => !myAlerts.includes(msg));

    return (
      <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-12">
        {/* Status Header */}
        <div className="glass-card p-8 rounded-3xl relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-theme-surface to-accent/5">
           <div style={{ position: 'absolute', top: 0, right: 0, width: '40%', height: '100%', background: 'linear-gradient(90deg, transparent, var(--accent-bg))', opacity: 0.5, pointerEvents: 'none' }} />
           
           <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                 <div className="flex items-center gap-2 mb-1">
                    <span className={`w-3 h-3 rounded-full ${myAlerts.length === 0 ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                    <span className={`text-xs font-black uppercase tracking-[0.2em] ${myAlerts.length === 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {myAlerts.length === 0 ? 'Live: All Clear' : 'Live: Critical Alert'}
                    </span>
                 </div>
                 <h1 className="text-4xl font-black tracking-tight">
                   {myAlerts.length === 0 ? '🟢 YOU ARE SAFE' : '🔴 ALERT IN YOUR ZONE'}
                 </h1>
                 <div className="flex flex-wrap items-center gap-4 text-sm font-bold opacity-80">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-accent" /> {userZone}
                    </div>
                    <span className="opacity-30">|</span>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-accent" /> Last checked in: 2 hours ago
                    </div>
                 </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                 <button 
                   onClick={async () => {
                      const ok = window.confirm("🚨 This will send an SOS signal with your current location to all emergency responders. Are you sure?");
                      if (ok) {
                        try {
                          await messagesApi.submitSafety('SOS-GENERAL', 'assistance');
                          toast.error("SOS Signal Transmitted Successfully", { duration: 5000, position: 'top-center', icon: '🚨' });
                        } catch (e) { toast.error("SOS Transmission Failed"); }
                      }
                   }}
                   className="px-8 py-4 bg-red-600 text-white rounded-3xl font-black text-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 border-4 border-red-500/50 emergency-btn-pulse"
                 >
                   <Zap className="w-7 h-7 fill-white" /> SOS
                 </button>
                 <span className="text-[10px] font-black text-red-500/70 uppercase tracking-widest mr-2">Personal Panic Button</span>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            
            {/* 1. MY ZONE SUMMARY (REAL DATA) */}
            <section className="glass-card p-6 rounded-3xl border-0 shadow-xl grid grid-cols-2 md:grid-cols-4 gap-4 bg-accent/5">
               <div className="space-y-1">
                  <div className="text-xs font-bold text-theme-muted uppercase tracking-wider">Your Zone</div>
                  <div className="text-lg font-black text-theme-primary">{userZone}</div>
               </div>
               <div className="space-y-1">
                  <div className="text-xs font-bold text-theme-muted uppercase tracking-wider">Registered</div>
                  <div className="text-lg font-black text-theme-primary">{citizenStats.count}</div>
               </div>
               <div className="space-y-1">
                  <div className="text-xs font-bold text-theme-muted uppercase tracking-wider">Marked Safe</div>
                  <div className="text-lg font-black text-green-500">{citizenStats.safeToday}</div>
               </div>
               <div className="space-y-1">
                  <div className="text-xs font-bold text-theme-muted uppercase tracking-wider">Active Alerts</div>
                  <div className="text-lg font-black text-accent">{myAlerts.length}</div>
               </div>
            </section>

            {/* 2. WEATHER WIDGET (Seasonal: April Summer) */}
            <section className="glass-card p-6 rounded-3xl border-0 shadow-xl flex items-center justify-between bg-orange-500/5 border border-orange-500/10">
               <div className="flex items-center gap-6">
                  <div className="text-5xl animate-pulse">☀️</div>
                  <div>
                     <h3 className="text-2xl font-black text-orange-700">Severe Heatwave — Mumbai</h3>
                     <div className="flex items-center gap-4 text-sm font-bold text-theme-muted mt-1">
                        <span>Temp: 41°C</span>
                        <span>•</span>
                        <span>Humidity: 45% (Dry)</span>
                        <span>•</span>
                        <span>UV Index: 11 (Extreme)</span>
                     </div>
                  </div>
               </div>
               <div className="hidden md:block px-4 py-2 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 font-bold text-xs">
                 ⚠️ High risk of dehydration
               </div>
            </section>

            {/* 3. YOUR ACTIVE ALERTS */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <Zap className="w-6 h-6 text-red-500 fill-red-500/20" />
                {t('yourActiveAlerts') || 'YOUR ACTIVE ALERTS'} ({myAlerts.length})
              </h2>

              {myAlerts.length === 0 ? (
                 <div className="glass-card p-12 text-center rounded-3xl border-dashed border-2">
                   <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                   <h3 className="text-lg font-bold">{t('allClear') || 'All Clear in Your Zone'}</h3>
                   <p className="text-sm text-theme-muted">{t('noActiveZoneAlerts') || 'There are no active emergency alerts matching your current zone.'}</p>
                 </div>
              ) : (
                <div className="grid gap-6">
                   {myAlerts.map((msg) => (
                     <div key={msg.id} className="glass-card overflow-hidden rounded-3xl border-0 shadow-lg group hover:shadow-2xl transition-all duration-300">
                       <div style={{ height: 4, background: msg.urgency === 'critical' ? '#ef4444' : '#f97316' }} />
                       <div className="p-6">
                         <div className="flex items-start justify-between gap-4 mb-4">
                           <div className="flex items-center gap-3">
                             <AlertBanner urgency={msg.urgency} />
                             <h3 className="font-bold text-xl">{msg.title}</h3>
                           </div>
                           <span className="text-xs font-bold px-2 py-1 rounded bg-theme-hover text-theme-dim">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                         </div>
                         
                         <p className="text-lg leading-relaxed text-theme-primary mb-6 whitespace-pre-wrap">{msg.master_content}</p>

                         {msg.urgency === 'critical' && (
                           <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 mb-6">
                             <h4 className="font-bold text-red-500 text-lg mb-4 flex items-center gap-2">
                               <AlertTriangle className="w-5 h-5" /> Are you safe?
                             </h4>
                             <div className="flex flex-col sm:flex-row gap-3">
                               <button 
                                 onClick={async () => {
                                   try {
                                     await messagesApi.submitSafety(msg.id, 'safe');
                                     toast.success("Glad to hear you're safe!");
                                     fetchData();
                                   } catch (e) { toast.error("Failed to submit"); }
                                 }}
                                 className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg"
                               >
                                 <CheckCircle className="w-5 h-5" /> {t('iAmSafe') || 'YES, I AM SAFE'}
                               </button>
                               <button 
                                 onClick={async () => {
                                   try {
                                     await messagesApi.submitSafety(msg.id, 'assistance');
                                     toast.error("Assistance request sent");
                                     fetchData();
                                   } catch (e) { toast.error("Failed to submit SOS"); }
                                 }}
                                 className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg"
                               >
                                 <AlertTriangle className="w-5 h-5" /> {t('iNeedAssistance') || 'SOS: I NEED HELP'}
                               </button>
                             </div>
                           </div>
                         )}
                       </div>
                     </div>
                   ))}
                </div>
              )}
            </section>
          </div>

          <div className="space-y-8">
            {/* 4. NEARBY SAFETY HUBS */}
            <section className="glass-card p-6 rounded-3xl border-0 shadow-xl bg-accent/5">
               <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                 <MapPin className="w-5 h-5 text-accent" /> {t('nearbySafetyHubs') || 'Nearby Safety Hubs'}
               </h2>
               <div className="space-y-3">
                  {EAPS.slice(0, 3).map((eap, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-accent/50 transition-all cursor-pointer group">
                       <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-sm group-hover:text-accent transition-colors">{eap.name}</h4>
                          <span className="text-[10px] font-bold text-accent px-2 py-0.5 rounded-full bg-accent/10">Active</span>
                       </div>
                       <p className="text-[10px] text-theme-muted mb-3">{eap.type} • Capacity: {eap.capacity}</p>
                       <button 
                         onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${eap.pos[0]},${eap.pos[1]}`, '_blank')}
                         className="w-full py-2 bg-theme-hover rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 hover:bg-accent hover:text-white transition-all"
                       >
                         <Navigation className="w-3 h-3" /> {t('getDirections') || 'GET DIRECTIONS'}
                       </button>
                    </div>
                  ))}
               </div>
               <button onClick={() => navigate('/map')} className="w-full mt-4 text-xs font-bold text-theme-dim hover:text-accent flex items-center justify-center gap-2">
                 {t('viewAllOnMap') || 'View all on map'} →
               </button>
            </section>

            {/* 5. SURVIVAL KNOWLEDGE BASE */}
            <section className="space-y-4">
               <h2 className="text-lg font-bold flex items-center gap-2">
                 <Shield className="w-5 h-5 text-accent" /> {t('survivalGuide') || 'Survival Guide'}
               </h2>
               <div className="grid grid-cols-1 gap-3">
                  {[
                    { title: 'Earthquake Safety', icon: '🫨', color: 'bg-orange-500', steps: ['Drop, Cover, Hold on', 'Stay away from glass'] },
                    { title: 'Flood Response', icon: '🌊', color: 'bg-blue-500', steps: ['Seek higher ground', 'Avoid moving water'] },
                    { title: 'Fire Protocol', icon: '🔥', color: 'bg-red-500', steps: ['Stop, Drop, Roll', 'Stay low to smoke'] },
                  ].map((guide, idx) => (
                    <div key={idx} className="glass-card p-4 rounded-2xl border-0 shadow-lg flex items-center gap-4 hover:translate-x-2 transition-transform cursor-pointer">
                       <div className={`w-12 h-12 ${guide.color} rounded-2xl flex items-center justify-center text-2xl shadow-inner`}>{guide.icon}</div>
                       <div>
                          <h4 className="font-bold text-sm">{guide.title}</h4>
                          <p className="text-[10px] text-theme-muted line-clamp-1">{guide.steps.join(' • ')}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {isAdmin && <SituationMapCard />}
      
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-3"><TrendingUp className="w-6 h-6" style={{ color: 'var(--accent)' }} />{t('dashboardTitle')}</h1><p className="text-sm mt-1 text-theme-muted">{t('dashboardSubtitle')}</p></div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button 
              onClick={() => navigate('/admin/simulation')}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold text-sm shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
            >
              <Zap className="w-4 h-4 fill-white" />
              Live Simulation
            </button>
          )}
          <button onClick={fetchData} className="btn-secondary text-sm"><RefreshCw className="w-4 h-4" /> {t('refresh')}</button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Zap} label={t('activeAlerts')} value={stats.active} color="#ef4444" trend="+2 since yesterday" />
        <Stat icon={Clock} label={t('expiringSoon')} value={stats.expiringSoon} color="#f97316" />
        <Stat icon={Send} label={t('totalSentToday')} value={stats.totalToday} color="var(--accent)" />
        <Stat icon={Timer} label={t('expiredLabel')} value={stats.expired} color="var(--text-dim)" />
      </div>

      {/* Safety Analytics Section */}
      {isAdmin && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-2xl border-0 shadow-lg relative overflow-hidden">
          <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: 'radial-gradient(circle, var(--accent-bg) 0%, transparent 70%)', opacity: 0.3 }} />
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-accent" /> {t('safetyResponseAnalytics') || 'Safety Response Analytics'}
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
               <div className="text-2xl font-black text-green-500">{safetyStats.safe}</div>
               <div className="text-[10px] font-bold uppercase tracking-wider text-green-600/70">{t('markedSafe') || 'Marked Safe'}</div>
            </div>
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
               <div className="text-2xl font-black text-red-500">{safetyStats.assistance}</div>
               <div className="text-[10px] font-bold uppercase tracking-wider text-red-600/70">{t('needAssistance') || 'Need Assistance'}</div>
            </div>
          </div>
          
          <div 
            onClick={() => navigate('/admin/simulation')}
            className="p-4 rounded-2xl bg-accent/5 border border-dashed border-accent/30 hover:border-accent hover:bg-accent/10 cursor-pointer transition-all group"
          >
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-accent animate-pulse" />
              <div>
                <div className="text-sm font-bold">UACS Live Simulation</div>
                <div className="text-[10px] text-theme-muted">Run side-by-side comparison</div>
              </div>
              <button className="ml-auto text-xs font-bold text-accent">Launch →</button>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border-0 shadow-lg">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <SafetyIcon className="w-5 h-5 text-accent" /> {t('recentSafetyReports') || 'Recent Safety Reports'}
          </h2>
          <div className="space-y-3">
             {recentReports.length === 0 ? (
               <div className="text-center py-8 text-theme-muted text-sm">No recent safety reports</div>
             ) : recentReports.map((r, idx) => (
               <div key={r.id || idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-theme-hover">
                 <div className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${r.status === 'safe' ? 'bg-green-500' : 'bg-red-500'}`} /> 
                   <span className={r.status === 'assistance' ? 'font-bold' : ''}>
                     {r.status === 'assistance' ? 'SOS: ' : ''}{r.user_name} ({r.zone || 'Unknown'})
                   </span>
                 </div>
                 <span className="text-theme-dim">{new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
               </div>
             ))}
          </div>
        </div>
      </div>
      )}

      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        {[
          { key: 'active',  icon: Zap,      label: `${t('activeAlerts') || 'Active'} (${activeMessages.length})`, roles: ['admin', 'user'] },
          { key: 'drafts',  icon: PenSquare, label: `${t('draftsTab') || 'Drafts'} (${draftMessages.length})`, roles: ['admin'] },
          { key: 'expired', icon: Clock,    label: `${t('expiredAlerts') || 'Expired'} (${expiredMessages.length})`, roles: ['admin', 'user'] },
        ].filter(tb => tb.roles.includes(user.role || 'admin')).map(tb => (
          <button key={tb.key} onClick={() => setActiveTab(tb.key)} className="px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2" style={{ background: activeTab===tb.key?'var(--accent)':'transparent', color: activeTab===tb.key?'white':'var(--text-muted)', boxShadow: activeTab===tb.key?'var(--shadow-md)':'none', border: 'none', cursor: 'pointer' }}><tb.icon className="w-3.5 h-3.5"/>{tb.label}</button>
        ))}
      </div>

      {activeTab==='active' && (<div className="space-y-3">
        {activeMessages.length===0 ? (<div className="glass-card p-12 text-center"><Activity className="w-12 h-12 mx-auto mb-4 text-theme-dim" /><h3 className="text-lg font-medium text-theme-secondary mb-2">{t('noActiveAlerts')}</h3><p className="text-sm text-theme-muted mb-4">{t('noActiveDesc')}</p><button onClick={()=>navigate('/compose')} className="btn-primary text-sm"><Send className="w-4 h-4" /> {t('composeMessage')}</button></div>
        ) : activeMessages.map((msg,i)=>(
          <div key={msg.id} className="glass-card p-5 animate-slide-up" style={{ animationDelay:`${i*60}ms` }}>
            <div className="flex flex-col lg:flex-row lg:items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap"><AlertBanner urgency={msg?.urgency} /><h3 className="font-semibold text-lg">{msg?.title}</h3></div>
                <p className="text-sm text-theme-secondary mb-3 line-clamp-2">{msg?.master_content}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-theme-muted"><div className="flex items-center gap-1.5">{(msg?.channels||[]).map(ch=><ChannelBadge key={ch} channel={ch}/>)}</div><span style={{color:'var(--border-strong)'}}>•</span><span>{(msg?.languages||[]).length} {t('languageCount') || 'language(s)'}</span><span style={{color:'var(--border-strong)'}}>•</span><span>{t('by')} {msg?.sent_by}</span></div>
              </div>
              <div className="flex flex-col items-end gap-3 shrink-0">
                {msg.expires_at && <ExpiryTimer expiresAt={msg.expires_at} status={msg.status}/>}
                {isAdmin && (
                <div className="flex items-center gap-2">
                  <button onClick={()=>handleExtend(msg?.id)} disabled={actionLoading[`x-${msg?.id}`]} className="btn-secondary text-xs py-1.5 px-3">{actionLoading[`x-${msg?.id}`]?<RefreshCw className="w-3 h-3 animate-spin"/>:<Timer className="w-3 h-3"/>} {t('extend')}</button>
                  <button onClick={()=>handleExpireNow(msg?.id)} disabled={actionLoading[`e-${msg?.id}`]} className="btn-danger text-xs py-1.5 px-3">{actionLoading[`e-${msg?.id}`]?<RefreshCw className="w-3 h-3 animate-spin"/>:<AlertTriangle className="w-3 h-3"/>} {t('expireNow')}</button>
                  <button onClick={()=>handleDelete(msg?.id)} disabled={actionLoading[`d-${msg?.id}`]} className="btn-secondary text-xs py-1.5 px-3" style={{color:'#ef4444',borderColor:'rgba(239,68,68,0.3)'}}>{actionLoading[`d-${msg?.id}`]?<RefreshCw className="w-3 h-3 animate-spin"/>:<X className="w-3 h-3"/>}</button>
                </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>)}

      {activeTab==='drafts' && (<div className="space-y-3">
        {draftMessages.length===0 ? (<div className="glass-card p-12 text-center"><PenSquare className="w-12 h-12 mx-auto mb-4 text-theme-dim" /><h3 className="text-lg font-medium text-theme-secondary mb-2">{t('noDraftsTitle') || 'No Draft Messages'}</h3><p className="text-sm text-theme-muted mb-4">{t('noDraftsDesc') || 'Saved drafts will appear here'}</p><button onClick={()=>navigate('/compose')} className="btn-primary text-sm"><Send className="w-4 h-4" /> {t('composeMessage')}</button></div>
        ) : draftMessages.map((msg,i)=>(
          <div key={msg.id} className="glass-card p-5 animate-slide-up" style={{ animationDelay:`${i*60}ms`, borderLeft: '3px solid var(--accent)' }}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap"><AlertBanner urgency={msg.urgency} /><h3 className="font-semibold">{msg.title}</h3></div>
                <p className="text-sm text-theme-muted line-clamp-1">{msg.master_content}</p>
                <p className="text-xs text-theme-dim mt-1">{t('by')} {msg.sent_by} · {new Date(msg.created_at||Date.now()).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={()=>navigate('/compose')} className="btn-secondary text-xs py-1.5 px-3"><PenSquare className="w-3 h-3"/> {t('editBtn') || 'Edit'}</button>
                <button onClick={()=>navigate(`/approval/${msg.id}`)} className="btn-primary text-xs py-1.5 px-3"><Send className="w-3 h-3"/> {t('send')}</button>
                <button onClick={()=>handleDelete(msg.id)} disabled={actionLoading[`d-${msg.id}`]} className="btn-secondary text-xs py-1.5 px-3" style={{color:'#ef4444',borderColor:'rgba(239,68,68,0.3)'}}>{actionLoading[`d-${msg.id}`]?<RefreshCw className="w-3 h-3 animate-spin"/>:<X className="w-3 h-3"/>}</button>
              </div>
            </div>
          </div>
        ))}
      </div>)}

      {activeTab==='expired' && (<div className="space-y-3">
        {expiredMessages.length===0 ? (<div className="glass-card p-12 text-center"><Clock className="w-12 h-12 mx-auto mb-4 text-theme-dim" /><h3 className="text-lg font-medium text-theme-secondary mb-2">{t('noExpiredAlerts')}</h3><p className="text-sm text-theme-muted">{t('noExpiredDesc')}</p></div>
        ) : expiredMessages.map((msg,i)=>(
          <div key={msg.id} className="glass-card p-5 opacity-75 animate-slide-up" style={{ animationDelay:`${i*60}ms` }}>
            <div className="flex flex-col lg:flex-row lg:items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap"><span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider" style={{ background:'var(--bg-hover)',color:'var(--text-muted)',border:'1px solid var(--border)'}}>{t('expired')}</span><h3 className="font-semibold">{msg.title}</h3></div>
                <p className="text-sm text-theme-muted mb-2 line-clamp-1">{msg.master_content}</p>
                <div className="flex items-center gap-3 text-xs text-theme-dim"><span>{t('expired')}: {msg.expires_at ? new Date(msg.expires_at).toLocaleString() : t('manual')}</span></div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={()=>navigate(`/approval/${msg.id}`)} className="btn-secondary text-xs py-1.5 px-3"><RotateCcw className="w-3 h-3"/> {t('resend')}</button>
                <button onClick={()=>navigate(`/approval/${msg.id}`)} className="btn-secondary text-xs py-1.5 px-3"><Eye className="w-3 h-3"/> {t('view')}</button>
              </div>
            </div>
          </div>
        ))}
      </div>)}

      {/* Floating Emergency Button (Admins only) */}
      {isAdmin && (
        <div 
          className="fixed bottom-8 right-8 z-[9999] flex flex-col items-center gap-2 cursor-pointer group"
          onClick={() => setIsEmergencyModalOpen(true)}
        >
          <button 
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl transition-transform group-hover:scale-110 emergency-btn-pulse"
            style={{ 
              background: '#ef4444', 
              border: 'none',
              color: 'white'
            }}
          >
            ⚠️
          </button>
          <span className="text-xs font-bold text-red-500 uppercase tracking-widest drop-shadow-md">
            {t('emergency') || 'Emergency'}
          </span>
        </div>
      )}

      {/* Emergency Modal */}
      {isEmergencyModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card max-w-lg w-full bg-[var(--bg-base)] border border-red-500/30 overflow-hidden shadow-2xl flex flex-col">
            
            <div className="p-6 border-b border-[var(--border)] bg-red-500/10 relative">
              <button 
                onClick={() => setIsEmergencyModalOpen(false)}
                className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-bold text-red-500 flex items-center gap-2">
                {t('emergencyBroadcast') || '⚠️ Emergency Broadcast'}
              </h2>
              <p className="text-sm text-red-400 mt-1">
                {t('emergencySubtitle') || 'Dispatches to ALL channels in ALL languages instantly'}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {emergencyError && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-500 text-sm">
                  {emergencyError}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[var(--text-secondary)]">  
                   {t('emergencyMessage') || 'Emergency Message'} <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="textarea-field w-full h-32"
                  placeholder={t('emergencyPlaceholder') || "Describe the emergency situation clearly and briefly..."}
                  value={emergencyText}
                  onChange={e => setEmergencyText(e.target.value)}
                  maxLength={300}
                />
                <div className="text-right text-xs mt-1 text-[var(--text-muted)]">
                  {emergencyText.length}/300
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-[var(--text-secondary)]">
                  {t('targetZone') || 'Target Zone'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input-field w-full"
                  placeholder={t('zonePlaceholder') || "e.g. Zone 4, Mumbai"}
                  value={emergencyZone}
                  onChange={e => setEmergencyZone(e.target.value)}
                />
              </div>

              <div className="p-4 bg-[var(--bg-hover)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-muted)] space-y-1 mt-2">
                <p><strong>{t('autoFilledSettings') || 'Auto-filled settings'}:</strong></p>
                <p>• {t('urgencyLevel') || 'Urgency'}: <span className="text-red-500">{t('critical')}</span></p>
                <p>• {t('selectChannels') || 'Channels'}: {t('allChannelsLabel') || 'All (SMS, Twitter, Radio, TV, Website)'}</p>
                <p>• {t('selectLanguages') || 'Languages'}: {t('allLanguagesLabel') || 'All Supported (Hi, Mr, Ta, Te, En)'}</p>
                <p>• {t('expiresIn') || 'Expires in'}: 6 {t('hours')}</p>
              </div>
            </div>

            <div className="p-6 border-t border-[var(--border)] bg-[var(--bg-surface)] flex flex-col gap-3">
              <button 
                onClick={handleEmergencySubmit}
                disabled={emergencyLoading}
                className="w-full py-3 rounded-lg font-bold text-white uppercase tracking-wider text-sm transition-all"
                style={{ background: emergencyLoading ? '#991b1b' : '#ef4444' }}
              >
                {emergencyLoading ? <RefreshCw className="w-5 h-5 mx-auto animate-spin" /> : (t('sendEmergency') || 'SEND EMERGENCY BROADCAST')}
              </button>
              
              <button 
                onClick={() => setIsEmergencyModalOpen(false)}
                disabled={emergencyLoading}
                className="w-full py-2 rounded-lg font-medium text-[var(--text-primary)] bg-[var(--bg-card)] border border(--border)] hover:bg-[var(--bg-hover)] transition-colors"
              >
                {t('cancel') || 'Cancel'}
              </button>
              
              <p className="text-xs text-center text-red-500 font-medium">
                {t('emergencyWarning') || '⚠️ This will immediately broadcast to all channels. This action cannot be undone.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Users, AlertTriangle, Calendar as CalendarIcon,
  Shield, Star, Zap, Award, Info, ChevronRight, Activity
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function StatsPage() {
  const { t } = useLanguage();
  const userZone = localStorage.getItem('uacs_pref_zone') || 'Zone 4';

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-fade-in">
      {/* 1. Zone Overview Header */}
      <div className="glass-card p-8 rounded-3xl relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-theme-surface to-accent/5">
         <div className="absolute top-0 right-0 p-8">
            <div className="w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center border border-accent/20">
               <Shield className="w-10 h-10 text-accent" />
            </div>
         </div>
         <div className="relative z-10">
            <h1 className="text-3xl font-black mb-2">{userZone} Analytics</h1>
            <p className="text-theme-muted mb-6">Transparency report for your community's disaster resilience.</p>
            <div className="flex flex-wrap gap-8">
               <div className="space-y-1">
                  <div className="text-3xl font-black text-theme-primary">2,847</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-theme-muted">Registered Citizens</div>
               </div>
               <div className="space-y-1">
                  <div className="text-3xl font-black text-green-500">89%</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-theme-muted">Safety Check-in Rate</div>
               </div>
               <div className="space-y-1">
                  <div className="text-3xl font-black text-accent">4.2m</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-theme-muted">Avg. Response Time</div>
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Left: Community & Personal Stats */}
         <div className="lg:col-span-2 space-y-8">
            
            {/* 2. Community Safety Score */}
            <section className="glass-card p-8 rounded-3xl border-0 shadow-xl relative overflow-hidden">
               <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Activity className="w-6 h-6 text-accent" /> Community Safety Score
                  </h2>
                  <span className="text-3xl font-black text-accent">84<span className="text-sm text-theme-muted">/100</span></span>
               </div>
               
               {/* Large Score Bar */}
               <div className="h-4 w-full bg-theme-hover rounded-full mb-8 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-accent to-blue-400 w-[84%] shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-theme-hover border border-theme-border text-center">
                     <div className="text-xs font-bold text-theme-muted mb-1">Zone Rank</div>
                     <div className="text-xl font-black text-theme-primary">2nd <span className="text-[10px] text-theme-dim">of 9</span></div>
                  </div>
                  <div className="p-4 rounded-2xl bg-theme-hover border border-theme-border text-center">
                     <div className="text-xs font-bold text-theme-muted mb-1">Resilience</div>
                     <div className="text-xl font-black text-green-500">EXCELLENT</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-theme-hover border border-theme-border text-center">
                     <div className="text-xs font-bold text-theme-muted mb-1">Growth</div>
                     <div className="text-xl font-black text-blue-500">+12%</div>
                  </div>
               </div>
            </section>

            {/* 3. Alert History Bar Chart (Seasonal: April Summer) */}
            <section className="glass-card p-8 rounded-3xl border-0 shadow-xl">
               <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                 <BarChart3 className="w-6 h-6 text-accent" /> Alerts History (Last 30 Days)
               </h2>
               <div className="flex items-end justify-between h-48 gap-4 mb-4 pt-8">
                  {[
                    { label: 'Heatwave', val: 7, color: 'bg-orange-600' },
                    { label: 'Fire', val: 3, color: 'bg-red-600' },
                    { label: 'Water', val: 5, color: 'bg-blue-400' },
                    { label: 'Dust', val: 2, color: 'bg-amber-600' },
                    { label: 'Power', val: 4, color: 'bg-yellow-500' },
                  ].map((bar, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-3 h-full">
                       <div className="flex-1 w-full bg-theme-hover rounded-t-xl relative overflow-hidden flex flex-col justify-end">
                          <div 
                            className={`${bar.color} w-full transition-all duration-1000 ease-out hover:opacity-80`} 
                            style={{ height: `${(bar.val / 10) * 100}%` }}
                          >
                             <div className="absolute top-2 left-0 right-0 text-center text-[10px] font-black text-white">{bar.val}</div>
                          </div>
                       </div>
                       <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">{bar.label}</span>
                    </div>
                  ))}
               </div>
               <p className="text-xs text-theme-muted text-center pt-4 border-t border-theme-border">
                 <strong>Most Common:</strong> Road Closure alerts were the highest frequency in {userZone} this month.
               </p>
            </section>
         </div>

         {/* Right: Personal Records & Calendar */}
         <div className="space-y-8">
            
            {/* 4. My Personal Stats */}
            <section className="glass-card p-6 rounded-3xl border-0 shadow-xl bg-accent text-white">
               <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                 <Award className="w-5 h-5" /> Your Safety Record
               </h2>
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <span className="text-xs font-medium opacity-80">Alerts Received</span>
                     <span className="text-xl font-black">24</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-xs font-medium opacity-80">Response Rate</span>
                     <span className="text-xl font-black">87%</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-xs font-medium opacity-80">Avg. Response</span>
                     <span className="text-xl font-black">3.1m</span>
                  </div>
                  <div className="pt-4 border-t border-white/20">
                     <div className="p-3 rounded-2xl bg-white/10 flex items-center gap-3">
                        <Star className="w-6 h-6 text-yellow-300 fill-yellow-300" />
                        <div>
                           <div className="text-[10px] font-black uppercase tracking-widest">Top Responder</div>
                           <div className="text-xs opacity-90">Top 15% in {userZone}</div>
                        </div>
                     </div>
                  </div>
               </div>
            </section>

            {/* 5. Zone Alert Calendar (Mini) */}
            <section className="glass-card p-6 rounded-3xl border-0 shadow-xl">
               <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
                 <CalendarIcon className="w-4 h-4 text-theme-dim" /> April 2026 Calendar
               </h2>
               <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 30 }).map((_, i) => {
                    const day = i + 1;
                    const alert = day === 5 ? 'bg-red-500' : day === 12 ? 'bg-orange-500' : day === 20 ? 'bg-yellow-500' : 'bg-theme-hover';
                    return (
                      <div key={i} className={`aspect-square rounded-md flex items-center justify-center text-[10px] font-bold ${alert} ${alert !== 'bg-theme-hover' ? 'text-white' : 'text-theme-muted'}`}>
                        {day}
                      </div>
                    );
                  })}
               </div>
               <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-[10px] text-theme-muted font-bold">
                     <div className="w-2 h-2 rounded-full bg-red-500" /> Critical Alert
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-theme-muted font-bold">
                     <div className="w-2 h-2 rounded-full bg-orange-500" /> High Alert
                  </div>
               </div>
            </section>

            {/* Why transparency matters */}
            <div className="p-6 rounded-3xl bg-blue-500/5 border border-dashed border-blue-500/30">
               <div className="flex items-center gap-3 mb-2 text-blue-600">
                  <Info className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Transparency</span>
               </div>
               <p className="text-[11px] text-theme-muted leading-relaxed">This data is publicly shared within your zone to build community trust and measure disaster preparedness efficacy.</p>
            </div>
         </div>
      </div>
    </div>
  );
}

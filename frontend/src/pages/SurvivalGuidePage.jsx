import { useState } from 'react';
import { 
  BookOpen, Search, Flame, Wind, Droplets, Zap, 
  Activity, ShieldAlert, Heart, Info, ChevronRight,
  FileText, Download, ExternalLink, PlayCircle
} from 'lucide-react';

const DISASTERS = [
  {
    id: 'earthquake',
    title: 'Earthquake',
    icon: Activity,
    color: 'bg-orange-500',
    description: 'Sudden shaking of the ground caused by seismic waves.',
    before: [
      'Identify safe spots in each room (under sturdy tables).',
      'Secure heavy furniture to walls.',
      'Keep a Go-Bag ready at all times.'
    ],
    during: [
      'DROP to the ground.',
      'COVER your head and neck under sturdy furniture.',
      'HOLD ON until the shaking stops.',
      'If outdoors, stay away from buildings and power lines.'
    ],
    after: [
      'Check for injuries and provide first aid.',
      'Expect aftershocks.',
      'Check for gas leaks or fire hazards.'
    ]
  },
  {
    id: 'flood',
    title: 'Flooding',
    icon: Droplets,
    color: 'bg-blue-500',
    description: 'Overflow of water onto normally dry land.',
    before: [
      'Identify high ground in your neighborhood.',
      'Keep important documents in waterproof bags.',
      'Install check valves in plumbing to prevent backup.'
    ],
    during: [
      'Move to the highest level of the building.',
      'Do not walk, swim, or drive through flood waters.',
      'Turn off main power if water enters.'
    ],
    after: [
      'Avoid standing water (may be electrically charged).',
      'Clean and disinfect everything that got wet.',
      'Listen for boil-water advisories.'
    ]
  },
  {
    id: 'cyclone',
    title: 'Cyclone/Storm',
    icon: Wind,
    color: 'bg-indigo-500',
    description: 'High-speed rotating winds with heavy rain.',
    before: [
      'Check your roof and clear gutters.',
      'Trim tree branches near your house.',
      'Board up windows or use storm shutters.'
    ],
    during: [
      'Stay indoors away from windows.',
      'Listen to local radio (93.5 FM) for updates.',
      'If the eye of the storm passes, stay inside; the other side is coming.'
    ],
    after: [
      'Beware of fallen power lines and unstable trees.',
      'Check neighbors for assistance.',
      'Document damage for insurance.'
    ]
  },
  {
    id: 'fire',
    title: 'Building Fire',
    icon: Flame,
    color: 'bg-red-500',
    description: 'Rapid combustion causing heat, smoke, and flames.',
    before: [
      'Install smoke detectors on every floor.',
      'Know at least two exit routes from every room.',
      'Keep a fire extinguisher handy.'
    ],
    during: [
      'Stay low to the ground to avoid smoke.',
      'Touch doors before opening; if hot, find another way.',
      'If clothes catch fire: Stop, Drop, and Roll.'
    ],
    after: [
      'Do not re-enter the building until cleared by fire officials.',
      'Check for structural damage.',
      'Seek medical help for burns or smoke inhalation.'
    ]
  },
  {
    id: 'heatwave',
    title: 'Heatwave',
    icon: Zap,
    color: 'bg-amber-600',
    description: 'Prolonged period of excessively hot weather.',
    before: [
      'Stock up on ORS and electrolytes.',
      'Insulate windows with reflective film.',
      'Identify cool public places (malls, libraries).'
    ],
    during: [
      'Drink plenty of water even if not thirsty.',
      'Wear light-colored, loose cotton clothing.',
      'Keep animals and children in the shade.'
    ],
    after: [
      'Monitor yourself for signs of heatstroke.',
      'Check on elderly neighbors.',
      'Continue hydration.'
    ]
  }
];

export default function SurvivalGuidePage() {
  const [selectedDisaster, setSelectedDisaster] = useState(DISASTERS[0]);
  const [search, setSearch] = useState('');

  const filteredDisasters = DISASTERS.filter(d => 
    d.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-fade-in">
      {/* Hero Section */}
      <div className="relative h-64 rounded-[2rem] overflow-hidden mb-12 shadow-2xl group">
         <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-accent/20 z-10" />
         <img 
           src="https://images.unsplash.com/photo-1511216335778-7cb8f49fa7a3?auto=format&fit=crop&q=80&w=1200" 
           className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
           alt="Emergency Preparedness"
         />
         <div className="absolute inset-0 z-20 p-10 flex flex-col justify-end">
            <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-4">
               <BookOpen className="w-10 h-10 text-accent" />
               National Survival Knowledge Base
            </h1>
            <p className="text-white/70 max-w-2xl font-medium uppercase tracking-widest text-xs">
               Your comprehensive guide to surviving any disaster on Indian soil.
            </p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar: Disaster Selection */}
        <div className="lg:col-span-4 space-y-6">
           <div className="glass-card p-4 rounded-3xl border-0 shadow-xl">
              <div className="relative mb-4">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-dim" />
                 <input 
                   type="text" 
                   placeholder="Search disasters..."
                   className="w-full pl-10 pr-4 py-3 bg-theme-hover border border-theme-border rounded-2xl text-sm outline-none focus:border-accent transition-all"
                   value={search}
                   onChange={e => setSearch(e.target.value)}
                 />
              </div>
              <div className="space-y-2">
                 {filteredDisasters.map(d => (
                   <button 
                     key={d.id}
                     onClick={() => setSelectedDisaster(d)}
                     className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${selectedDisaster.id === d.id ? 'bg-accent text-white shadow-xl shadow-accent/20 scale-[1.02]' : 'hover:bg-theme-hover text-theme-primary'}`}
                   >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedDisaster.id === d.id ? 'bg-white/20' : d.color + '/10 ' + d.color.replace('bg-', 'text-')}`}>
                         <d.icon className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-sm">{d.title}</span>
                      <ChevronRight className={`ml-auto w-4 h-4 ${selectedDisaster.id === d.id ? 'opacity-100' : 'opacity-20'}`} />
                   </button>
                 ))}
              </div>
           </div>

           {/* Quick Actions */}
           <div className="space-y-4">
              <button className="w-full p-6 rounded-3xl bg-theme-surface border border-theme-border flex items-center justify-between hover:border-accent transition-all group">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-500/10 text-red-600 rounded-full flex items-center justify-center">
                       <Heart className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                       <h4 className="font-bold text-sm">First Aid Guide</h4>
                       <p className="text-[10px] text-theme-muted uppercase font-bold">Quick protocols</p>
                    </div>
                 </div>
                 <ExternalLink className="w-4 h-4 text-theme-dim group-hover:text-accent" />
              </button>
              <button className="w-full p-6 rounded-3xl bg-theme-surface border border-theme-border flex items-center justify-between hover:border-accent transition-all group">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-accent/10 text-accent rounded-full flex items-center justify-center">
                       <Download className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                       <h4 className="font-bold text-sm">Download Offline PDF</h4>
                       <p className="text-[10px] text-theme-muted uppercase font-bold">Pocket reference</p>
                    </div>
                 </div>
                 <FileText className="w-4 h-4 text-theme-dim group-hover:text-accent" />
              </button>
           </div>
        </div>

        {/* Content Area: Selected Disaster Deep Dive */}
        <div className="lg:col-span-8 space-y-8">
           <div className="glass-card p-10 rounded-[2.5rem] border-0 shadow-2xl animate-fade-in" key={selectedDisaster.id}>
              <div className="flex flex-col sm:flex-row items-start justify-between gap-6 mb-10">
                 <div className="flex items-center gap-6">
                    <div className={`w-20 h-20 rounded-3xl ${selectedDisaster.color} flex items-center justify-center text-white shadow-2xl`}>
                       <selectedDisaster.icon className="w-10 h-10" />
                    </div>
                    <div>
                       <h2 className="text-4xl font-black mb-2">{selectedDisaster.title}</h2>
                       <p className="text-theme-muted font-medium">{selectedDisaster.description}</p>
                    </div>
                 </div>
                 <button className="px-5 py-2 bg-theme-hover rounded-full text-xs font-black flex items-center gap-2 hover:bg-accent hover:text-white transition-all">
                    <PlayCircle className="w-4 h-4" /> WATCH TRAINING
                 </button>
              </div>

              {/* Protocol Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 
                 {/* BEFORE */}
                 <div className="space-y-4">
                    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-theme-hover w-fit">
                       <ShieldAlert className="w-4 h-4 text-blue-500" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Phase 1: Before</span>
                    </div>
                    <ul className="space-y-3">
                       {selectedDisaster.before.map((step, idx) => (
                         <li key={idx} className="p-4 rounded-2xl bg-theme-surface border border-theme-border text-sm font-medium leading-relaxed flex gap-3">
                            <span className="w-5 h-5 rounded-full bg-theme-hover flex items-center justify-center text-[10px] shrink-0 font-bold">{idx+1}</span>
                            {step}
                         </li>
                       ))}
                    </ul>
                 </div>

                 {/* DURING */}
                 <div className="space-y-4">
                    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-red-500/10 w-fit">
                       <Zap className="w-4 h-4 text-red-500" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-red-600">Phase 2: During</span>
                    </div>
                    <ul className="space-y-3">
                       {selectedDisaster.during.map((step, idx) => (
                         <li key={idx} className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-sm font-black text-red-800 leading-relaxed flex gap-3">
                            <span className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] shrink-0">{idx+1}</span>
                            {step}
                         </li>
                       ))}
                    </ul>
                 </div>

                 {/* AFTER */}
                 <div className="space-y-4">
                    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-green-500/10 w-fit">
                       <CheckCircle className="w-4 h-4 text-green-500" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-green-600">Phase 3: After</span>
                    </div>
                    <ul className="space-y-3">
                       {selectedDisaster.after.map((step, idx) => (
                         <li key={idx} className="p-4 rounded-2xl bg-green-500/5 border border-green-500/10 text-sm font-medium leading-relaxed flex gap-3">
                            <span className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] shrink-0 font-bold">{idx+1}</span>
                            {step}
                         </li>
                       ))}
                    </ul>
                 </div>

              </div>

              {/* Tips & Facts */}
              <div className="mt-12 p-8 rounded-[2rem] bg-theme-hover/50 border border-theme-border flex items-start gap-6">
                 <Info className="w-8 h-8 text-accent shrink-0" />
                 <div>
                    <h4 className="font-bold text-lg mb-2">Did You Know?</h4>
                    <p className="text-sm text-theme-muted leading-relaxed">
                       In most disasters, the highest casualties occur due to panic rather than the disaster itself. 
                       Practicing these drills just twice a year increases your survival rate by over 40%.
                    </p>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}

// Icons
const CheckCircle = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);

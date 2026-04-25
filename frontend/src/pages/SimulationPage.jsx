import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, Pause, SkipForward, RotateCcw, Send, Activity, 
  Shield, AlertTriangle, CheckCircle2, Clock, Zap, Globe, 
  MessageSquare, Radio, Tv, AlertCircle, TrendingUp,
  Flame, Wind, Battery, HeartPulse, Construction, Info, X
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import toast from 'react-hot-toast';

const SCENARIOS = [
  { id: 'flood',   icon: Flame,  name: 'Flood Warning',   color: '#3b82f6', zone: 'Zone 4', emoji: '🌊' },
  { id: 'fire',    icon: Flame,  name: 'Fire Alert',      color: '#ef4444', zone: 'Zone 2', emoji: '🔥' },
  { id: 'cyclone', icon: Wind,   name: 'Cyclone Warning', color: '#8b5cf6', zone: 'Zone 1', emoji: '🌪️' },
  { id: 'power',   icon: Battery, name: 'Power Outage',    color: '#f59e0b', zone: 'Zone 5', emoji: '⚡' },
  { id: 'health',  icon: HeartPulse, name: 'Health Emergency', color: '#10b981', zone: 'Zone 3', emoji: '🏥' },
  { id: 'road',    icon: Construction, name: 'Road Closure',  color: '#6b7280', zone: 'Zone 4', emoji: '🚧' },
];

const SCENARIO_DATA = {
  flood: {
    masterMessage: "Flood warning issued for Zone 4. All residents must evacuate immediately to nearest relief camp. Carry essential documents only.",
    steps: [
      {
        time: "T+0:00",
        title: "Disaster Detected",
        without: { action: "Officer calls other departments to coordinate message content", problem: "45s wasted on coordination calls", status: "error" },
        with: { action: "Admin opens UACS Composer. Types master message once.", result: "Ready in 10 seconds", status: "success" }
      },
      {
        time: "T+2:00",
        title: "Message Composition",
        without: { action: "4 people writing 4 different messages for SMS, Globe, Radio, TV", problem: "Inconsistent wording & urgency", status: "error" },
        with: { action: "UACS auto-formats one master message for all 4 channels", result: "Single source of truth", status: "success" }
      },
      {
        time: "T+5:00",
        title: "Messages Dispatched",
        without: {
          channels: {
            sms: "Flood warning in Zone 4 area. Move to higher ground.",
            twitter: "Heavy rains expected. Zone 4 stay alert. #FloodAlert",
            radio: "Reports of possible flooding near Zone 4. Consider precautions.",
            tv: "Zone 4: Heavy rainfall warning"
          },
          problems: ["4 different urgency levels", "Conflicting instructions", "Citizens are confused"],
          consistency: 23,
          status: "error"
        },
        with: {
          channels: {
            sms: "🚨 UACS ALERT - CRITICAL\nFlood warning Zone 4. Evacuate immediately.",
            twitter: "🚨 CRITICAL: Flood warning Zone 4. Evacuate immediately. #UACS",
            radio: "Official UACS broadcast. Flood warning Zone 4. Evacuate immediately.",
            tv: "🚨 CRITICAL FLOOD WARNING ZONE 4 — EVACUATE IMMEDIATELY"
          },
          results: ["Same urgency: CRITICAL", "Same action: Evacuate", "Zero conflicting info"],
          consistency: 96,
          status: "success"
        }
      },
      {
        time: "T+8:00",
        title: "Language Coverage",
        without: { action: "Alert sent in English only. Regional language speakers get nothing.", problem: "40% of zone unreachable", status: "error" },
        with: { action: "UACS auto-translates to 5 languages simultaneously", languages: ["English ✅", "Hindi ✅", "Marathi ✅", "Tamil ✅", "Telugu ✅"], result: "100% of zone reached", status: "success" }
      },
      {
        time: "T+3hrs",
        title: "Alert Expiry",
        without: { action: "Danger resolved at 3PM. Old alert still circulating at 8PM.", problem: "Citizens don't know if danger is over.", status: "error" },
        with: { action: "Expiry set to 3PM. Auto-retracts and sends 'All Clear' instantly.", result: "Zero unnecessary panic", status: "success" }
      }
    ],
    impact: { timeWithout: "47m", timeWith: "2m", langWithout: "1", langWith: "5", consWithout: "23%", consWith: "96%", confWithout: "67%", confWith: "4%" }
  },
  fire: {
    masterMessage: "Wildfire detected near Zone 2 boundary. High winds expected. Residents should prepare for potential evacuation. Close all windows.",
    steps: [
      {
        time: "T+0:00",
        title: "Detection",
        without: { action: "Manual reporting via phone lines. Departments argue over zone boundaries.", problem: "Confusion over who is in charge", status: "error" },
        with: { action: "Satellite/Sensor data triggers UACS incident. Zone 2 auto-selected.", result: "Instant boundary lock", status: "success" }
      },
      {
        time: "T+3:00",
        title: "Drafting",
        without: { action: "Typing 10 different SMS messages for different service providers.", problem: "Typo in evacuation route on 2 versions.", status: "error" },
        with: { action: "One 'master' draft used for all operators.", result: "Eliminated human error", status: "success" }
      },
      {
        time: "T+6:00",
        title: "Dispatch",
        without: {
          channels: {
            sms: "Fire near Zone 2. Watch out.",
            twitter: "Smoke reported in North District. Be careful.",
            radio: "Minor fire incident. No immediate danger.",
            tv: "Zone 2 Fire: Evacuate if you see smoke."
          },
          problems: ["Mixed signals", "Radio says 'No Danger' but TV says 'Evacuate'"],
          consistency: 31,
          status: "error"
        },
        with: {
          channels: {
            sms: "🔥 UACS FIRE ALERT: Zone 2 residents prepare for evacuation. Wind speed high.",
            twitter: "🔥 ALERT: Zone 2 Wildfire. Prepare for evacuation. #UACS #Zone2",
            radio: "UACS Authority: Zone 2 wildfire alert. Prepare for evacuation.",
            tv: "🔥 FIRE ALERT ZONE 2: PREPARE FOR EVACUATION"
          },
          results: ["Unified urgency", "Identical instructions", "98% consistency"],
          consistency: 98,
          status: "success"
        }
      },
      {
        time: "T+10:00",
        title: "Scaling",
        without: { action: "Network congestion blocks manual SMS blasts.", problem: "Delayed delivery", status: "error" },
        with: { action: "UACS uses priority government channel (Twilio High Priority).", result: "99.9% delivery rate", status: "success" }
      },
      {
        time: "T+4hrs",
        title: "Cleanup",
        without: { action: "Fire out. People still calling emergency line asking if it's safe.", problem: "Phone lines clogged unnecessarily.", status: "error" },
        with: { action: "UACS sends automated 'All Clear' and updates Web Portal.", result: "Public informed instantly", status: "success" }
      }
    ],
    impact: { timeWithout: "52m", timeWith: "4m", langWithout: "1", langWith: "5", consWithout: "31%", consWith: "98%", confWithout: "55%", confWith: "2%" }
  },
  cyclone: {
    masterMessage: "Cyclone Warning: Zone 1 coastal areas expect heavy rain and winds up to 120kmph. Stay indoors. Fishermen should not go to sea.",
    steps: [
      {
        time: "T+0:00",
        title: "Forecast",
        without: { action: "Weather dept faxes warning to Admin office. Fax is missed.", problem: "20 min delay in reading warning", status: "error" },
        with: { action: "Weather API auto-creates draft in UACS dashboard.", result: "Zero delay in awareness", status: "success" }
      },
      {
        time: "T+5:00",
        title: "Approval",
        without: { action: "Admin drives to office to sign physical approval form.", problem: "Physical transit time loss", status: "error" },
        with: { action: "Admin approves via UACS Mobile App with secure login.", result: "Remote approval in 30s", status: "success" }
      },
      {
        time: "T+10:00",
        title: "Broadcast",
        without: {
          channels: {
            sms: "Cyclone coming. Stay safe.",
            twitter: "Rain expected tomorrow. #Weather",
            radio: "High tides in Zone 1. Warning issued.",
            tv: "Coastal Alert: Storm expected."
          },
          problems: ["Vague timings", "No specific actions mentioned"],
          consistency: 40,
          status: "error"
        },
        with: {
          channels: {
            sms: "🌪️ UACS CYCLONE: Zone 1, heavy rain/120kmph winds. STAY INDOORS.",
            twitter: "🌪️ UACS: Cyclone Warning Zone 1. 120kmph winds. Stay indoors. #Cyclone",
            radio: "UACS Alert: Cyclone Zone 1. Stay indoors immediately.",
            tv: "🌪️ UACS CYCLONE WARNING: STAY INDOORS (ZONE 1)"
          },
          results: ["Specific metrics (120kmph)", "Clear action (Stay indoors)"],
          consistency: 94,
          status: "success"
        }
      },
      {
        time: "T+15:00",
        title: "Reach",
        without: { action: "Coastal villages with poor internet miss the Twitter update.", problem: "Silent zones in rural areas", status: "error" },
        with: { action: "UACS triggers Radio and TV interrupts simultaneously.", result: "Rural coverage ensured", status: "success" }
      },
      {
        time: "T+12hrs",
        title: "Retraction",
        without: { action: "Storm passed. People still hiding in shelters 6 hours late.", problem: "Economic productivity loss", status: "error" },
        with: { action: "Scheduled retraction releases 'Safe to Exit' alert.", result: "Return to normalcy 6hr faster", status: "success" }
      }
    ],
    impact: { timeWithout: "65m", timeWith: "6m", langWithout: "1", langWith: "5", consWithout: "40%", consWith: "94%", confWithout: "48%", confWith: "5%" }
  },
  power: {
    masterMessage: "Emergency Power Outage in Zone 5 due to grid failure. Restoration expected by 10:00 PM. Vital services moving to backup.",
    steps: [
      {
        time: "T+0:00",
        title: "Blackout",
        without: { action: "Public calls electric board. No one answers. Panic spreads.", problem: "Information vacuum", status: "error" },
        with: { action: "Grid monitor triggers UACS notification to Zone 5.", result: "Pre-emptive info dispatch", status: "success" }
      },
      {
        time: "T+10:00",
        title: "Guidance",
        without: { action: "No official word. People think it's a permanent failure.", problem: "Panic buying of supplies", status: "error" },
        with: { action: "UACS sends 'Expectation Management' alert (10 PM fix).", result: "Reduced anxiety", status: "success" }
      },
      {
        time: "T+15:00",
        title: "Impact",
        without: {
          channels: {
            sms: "Power cut. Working on it.",
            twitter: "Grid down. Maintenance soon.",
            radio: "Electricity issue in some parts.",
            tv: "Power interruption reported."
          },
          problems: ["No mention of Zone 5 specifically", "No estimated time"],
          consistency: 18,
          status: "error"
        },
        with: {
          channels: {
            sms: "⚡ UACS: Power Outage Zone 5. Fix by 10PM. Vital services active.",
            twitter: "⚡ UACS: Zone 5 Grid Outage. Fix by 10PM. #UACS #Zone5",
            radio: "UACS: Zone 5 power restoration by 10PM.",
            tv: "⚡ ZONE 5 POWER OUTAGE: RESTORATION AT 10PM"
          },
          results: ["Time-bound expectation", "Zone-specific targeting"],
          consistency: 99,
          status: "success"
        }
      },
      {
        time: "T+20:00",
        title: "Critical Sync",
        without: { action: "Hospitals in Zone 5 unaware of total grid failure duration.", problem: "Generator fuel management risk", status: "error" },
        with: { action: "UACS sends high-priority technical brief to hospitals.", result: "Life-saving coordination", status: "success" }
      },
      {
        time: "T+FIX",
        title: "Restoration",
        without: { action: "Power back. People still don't know it's stable.", problem: "Hesitation to resume ops", status: "error" },
        with: { action: "Instant 'Restored' notification sent via UACS.", result: "Full recovery in seconds", status: "success" }
      }
    ],
    impact: { timeWithout: "30m", timeWith: "2m", langWithout: "1", langWith: "5", consWithout: "18%", consWith: "99%", confWithout: "78%", confWith: "1%" }
  },
  health: {
    masterMessage: "Public Health Emergency: Zone 3 clinic reports outbreak. Mask mandate in effect for Zone 3. Avoid large gatherings until further notice.",
    steps: [
      {
        time: "T+0:00",
        title: "Outbreak",
        without: { action: "Doctors call Health Dept. Info gets stuck in bureaucracy.", problem: "72 hour delay in public alert", status: "error" },
        with: { action: "Clinic uploads report to UACS. Alert drafted in 5 mins.", result: "Contained in hours, not days", status: "success" }
      },
      {
        time: "T+1hr",
        title: "Instruction",
        without: { action: "People in Zone 3 continue attending a local fair.", problem: "Super-spreader event occurs", status: "error" },
        with: { action: "UACS sends mandatory mask/distancing alert.", result: "Immediate public compliance", status: "success" }
      },
      {
        time: "T+2hr",
        title: "Sourcing",
        without: {
          channels: {
            sms: "Wear masks. Health issue.",
            twitter: "Be safe. #HealthUpdate",
            radio: "Flu reported. Take care.",
            tv: "Health Advisory: Stay home."
          },
          problems: ["No specific action mentioned", "Confused with common flu"],
          consistency: 15,
          status: "error"
        },
        with: {
          channels: {
            sms: "🏥 UACS HEALTH: Zone 3 Outbreak. Mask mandate active. Avoid crowds.",
            twitter: "🏥 UACS: Zone 3 Health Alert. Wear Masks. Avoid crowds. #Health",
            radio: "UACS: Zone 3 mandatory mask warning active.",
            tv: "🏥 HEALTH EMERGENCY ZONE 3: MASK MANDATE ACTIVE"
          },
          results: ["Uniform protocol", "Clear mandate", "Zero ambiguity"],
          consistency: 97,
          status: "success"
        }
      },
      {
        time: "T+5hr",
        title: "Data",
        without: { action: "No way to track if people are okay.", problem: "Zero field feedback", status: "error" },
        with: { action: "UACS 'Safe/Help' button allows citizens to report symptoms.", result: "Heatmap of spread created", status: "success" }
      },
      {
        time: "T+REMEDY",
        title: "Conclusion",
        without: { action: "Fear persists for weeks after danger is gone.", problem: "Economic shutdown continues", status: "error" },
        with: { action: "UACS releases 'Safe Zone' status update.", result: "Rapid economic bounceback", status: "success" }
      }
    ],
    impact: { timeWithout: "72h", timeWith: "1h", langWithout: "1", langWith: "5", consWithout: "15%", consWith: "97%", confWithout: "89%", confWith: "3%" }
  },
  road: {
    masterMessage: "Major Road Closure: Zone 4 main highway blocked due to landslide. Use Old Bridge bypass. Expected clearance: 6 hours.",
    steps: [
      {
        time: "T+0:00",
        title: "Incident",
        without: { action: "Traffic police manually divert cars at the spot.", problem: "5km traffic jam forms in 15 mins", status: "error" },
        with: { action: "Landslide sensor triggers UACS road alert.", result: "Diverted at source 10km away", status: "success" }
      },
      {
        time: "T+5:00",
        title: "Navigation",
        without: { action: "People follow Google Maps into the jam.", problem: "Google takes 10 mins to update", status: "error" },
        with: { action: "UACS push notification gives bypass instructions.", result: "Smooth flow through bypass", status: "success" }
      },
      {
        time: "T+10:00",
        title: "Consistency",
        without: {
          channels: {
            sms: "Road closed. Take bypass.",
            twitter: "Traffic jam in Zone 4. #Traffic",
            radio: "Avoid Zone 4 highway.",
            tv: "Landslide in Zone 4."
          },
          problems: ["Bypass name not mentioned in all", "Wait time not mentioned"],
          consistency: 33,
          status: "error"
        },
        with: {
          channels: {
            sms: "🚧 UACS ROAD: Zone 4 Highway CLOSED. Use Old Bridge Bypass. 6h wait.",
            twitter: "🚧 UACS: Zone 4 Landslide. Use Old Bridge Bypass. #Traffic #Zone4",
            radio: "UACS: Zone 4 highway closed. Bypass via Old Bridge.",
            tv: "🚧 ZONE 4 HIGHWAY CLOSED: BYPASS VIA OLD BRIDGE"
          },
          results: ["Same detour name", "Accurate wait time estimate"],
          consistency: 95,
          status: "success"
        }
      },
      {
        time: "T+15:00",
        title: "Logistics",
        without: { action: "Emergency vehicles get stuck in the traffic jam.", problem: "Delayed relief access", status: "error" },
        with: { action: "UACS clears a 'Green Lane' by notifying all cars to move.", result: "Emergency access maintained", status: "success" }
      },
      {
        time: "T+6hrs",
        title: "Reopening",
        without: { action: "Road opens but people still taking the long bypass.", problem: "Wasted fuel and time", status: "error" },
        with: { action: "UACS sends 'Road Open' notification to all diversions.", result: "Traffic restored instantly", status: "success" }
      }
    ],
    impact: { timeWithout: "40m", timeWith: "3m", langWithout: "1", langWith: "5", consWithout: "33%", consWith: "95%", confWithout: "62%", confWith: "2%" }
  }
};

export default function SimulationPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [simState, setSimState] = useState('idle'); // idle, running, paused, complete
  const [currentStep, setCurrentStep] = useState(-1);
  const [progress, setProgress] = useState(0);

  const scenario = selectedScenario ? SCENARIO_DATA[selectedScenario.id] : null;

  useEffect(() => {
    let timer;
    if (simState === 'running' && currentStep < (scenario?.steps.length || 0) - 1) {
      timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setProgress(p => p + (100 / scenario.steps.length));
      }, 3000);
    } else if (currentStep === (scenario?.steps.length || 0) - 1) {
      setTimeout(() => setSimState('complete'), 2000);
    }
    return () => clearTimeout(timer);
  }, [simState, currentStep, scenario]);

  const startSimulation = () => {
    if (!selectedScenario) return;
    setSimState('running');
    setCurrentStep(0);
    setProgress(0);
  };

  const resetSimulation = () => {
    setSimState('idle');
    setCurrentStep(-1);
    setSelectedScenario(null);
    setProgress(0);
  };

  const ChannelBubble = ({ type, message, side }) => {
    const icons = { sms: MessageSquare, twitter: Globe, radio: Radio, tv: Tv };
    const Icon = icons[type] || MessageSquare;
    const color = side === 'with' ? 'var(--accent)' : '#ef4444';
    
    return (
      <div className="p-3 rounded-xl bg-theme-surface border border-theme-border flex gap-3 animate-slide-up">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}20`, color }}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-wider mb-1 text-theme-dim">{type}</div>
          <div className="text-xs leading-relaxed break-words">{message}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3">
            <Activity className="w-8 h-8 text-accent" />
            UACS Live Simulation
          </h1>
          <p className="text-theme-muted mt-1">Watch how UACS solves the inconsistent government messaging problem in real-time.</p>
        </div>
        {simState !== 'idle' && (
          <button onClick={resetSimulation} className="btn-secondary text-sm">
            <RotateCcw className="w-4 h-4" /> {t('reset')}
          </button>
        )}
      </div>

      {simState === 'idle' ? (
        /* Section 1: Scenario Selector */
        <section className="space-y-6">
          <h2 className="text-xl font-bold border-l-4 border-accent pl-4">Choose a Disaster Scenario</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {SCENARIOS.map(s => (
              <div 
                key={s.id}
                onClick={() => setSelectedScenario(s)}
                className={`glass-card p-6 cursor-pointer transition-all duration-300 group hover:scale-[1.02] ${selectedScenario?.id === s.id ? 'ring-2 ring-accent border-accent bg-accent/5' : 'hover:border-accent/30'}`}
              >
                <div className="text-4xl mb-4 group-hover:animate-bounce">{s.emoji}</div>
                <h3 className="font-bold text-lg">{s.name}</h3>
                <p className="text-xs text-theme-muted mt-1">Affects: {s.zone}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-center pt-8">
            <button 
              onClick={startSimulation}
              disabled={!selectedScenario}
              className="px-12 py-4 rounded-full bg-accent text-white font-black text-lg shadow-2xl shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform flex items-center gap-3"
            >
              <Play className="w-6 h-6 fill-white" /> START SIMULATION
            </button>
          </div>
        </section>
      ) : simState === 'complete' ? (
        /* Section 3: Impact Results */
        <section className="space-y-8 animate-fade-in">
          <div className="text-center py-6">
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-green-500/10 text-green-500 font-black border border-green-500/30">
              <CheckCircle2 className="w-5 h-5" /> SIMULATION COMPLETE
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <ImpactCard title="Response Time" without={scenario.impact.timeWithout} with={scenario.impact.timeWith} gain="Saved 45 mins ⚡" />
            <ImpactCard title="Languages" without={scenario.impact.langWithout} with={scenario.impact.langWith} gain="5x more reach 🌐" />
            <ImpactCard title="Consistency" without={scenario.impact.consWithout} with={scenario.impact.consWith} gain="4x more consistent ✅" />
            <ImpactCard title="Confusion" without={scenario.impact.confWithout} with={scenario.impact.confWith} gain="94% less confusion 🎯" />
            <ImpactCard title="Alert Retraction" without="Never" with="On Time" gain="Zero outdated alerts ⏰" />
            <ImpactCard title="Contact Sync" without="0" with="Auto" gain="Family notified 👨👩👧" />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-12">
            <button onClick={resetSimulation} className="btn-secondary w-full sm:w-auto px-8 py-3 rounded-xl font-bold">
              <RotateCcw className="w-4 h-4" /> Run Another Scenario
            </button>
            <button onClick={() => navigate('/compose')} className="btn-primary w-full sm:w-auto px-8 py-3 rounded-xl font-bold flex items-center gap-2">
              <Send className="w-4 h-4" /> Send Real Alert Now →
            </button>
          </div>
        </section>
      ) : (
        /* Section 2: Simulation Engine */
        <div className="space-y-6">
          {/* Progress Timeline */}
          <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
             <div className="flex justify-between relative z-10">
               {scenario.steps.map((step, idx) => (
                 <div key={idx} className="flex flex-col items-center gap-2 z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-500 ${idx <= currentStep ? 'bg-accent text-white scale-110 shadow-lg' : 'bg-theme-surface text-theme-muted'}`}>
                      {idx < currentStep ? <CheckCircle2 className="w-5 h-5" /> : step.time}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${idx === currentStep ? 'text-accent' : 'text-theme-dim'}`}>{step.title}</span>
                 </div>
               ))}
               {/* Progress Line */}
               <div className="absolute top-5 left-8 right-8 h-[2px] bg-theme-border -z-0" />
               <div 
                 className="absolute top-5 left-8 h-[2px] bg-accent -z-0 transition-all duration-500" 
                 style={{ width: `${(currentStep / (scenario.steps.length - 1)) * 100}%` }}
               />
             </div>
          </div>

          {/* Side-by-Side Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[500px]">
            {/* WITHOUT UACS */}
            <div className="flex flex-col rounded-3xl overflow-hidden border border-red-500/20 shadow-xl bg-red-500/[0.02]">
              <div className="bg-red-500 text-white px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="font-black flex items-center gap-2">❌ WITHOUT UACS</h3>
                  <span className="text-xs opacity-80 uppercase tracking-widest font-bold">The Traditional Way</span>
                </div>
                <AlertCircle className="w-6 h-6 opacity-50" />
              </div>
              <div className="p-6 flex-1 space-y-6 overflow-y-auto">
                {scenario.steps.slice(0, currentStep + 1).map((step, idx) => (
                  <div key={idx} className="animate-slide-up space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-red-500 bg-red-500/10 w-fit px-2 py-1 rounded">
                      <Clock className="w-3 h-3" /> {step.time}
                    </div>
                    {step.without.channels ? (
                      <div className="grid grid-cols-1 gap-2">
                        {Object.entries(step.without.channels).map(([ch, msg]) => (
                          <ChannelBubble key={ch} type={ch} message={msg} side="without" />
                        ))}
                        <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                           <div className="flex items-center justify-between mb-2">
                             <span className="text-[10px] font-bold text-red-500 uppercase">Consistency Score</span>
                             <span className="text-xs font-black text-red-500">{step.without.consistency}%</span>
                           </div>
                           <div className="h-1.5 w-full bg-red-500/20 rounded-full overflow-hidden">
                             <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${step.without.consistency}%` }} />
                           </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-theme-surface border border-theme-border border-l-4 border-l-red-500">
                        <p className="text-sm font-medium mb-1">{step.without.action}</p>
                        <p className="text-xs text-red-500 font-bold flex items-center gap-1">
                          <X className="w-3 h-3" /> {step.without.problem}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* WITH UACS */}
            <div className="flex flex-col rounded-3xl overflow-hidden border border-accent/20 shadow-xl bg-accent/[0.02]">
              <div className="bg-accent text-white px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="font-black flex items-center gap-2">✅ WITH UACS</h3>
                  <span className="text-xs opacity-80 uppercase tracking-widest font-bold">The UACS Way</span>
                </div>
                <Zap className="w-6 h-6 opacity-50" />
              </div>
              <div className="p-6 flex-1 space-y-6 overflow-y-auto">
                {scenario.steps.slice(0, currentStep + 1).map((step, idx) => (
                  <div key={idx} className="animate-slide-up space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-accent bg-accent/10 w-fit px-2 py-1 rounded">
                      <Clock className="w-3 h-3" /> {step.time}
                    </div>
                    {step.with.channels ? (
                      <div className="grid grid-cols-1 gap-2">
                        {Object.entries(step.with.channels).map(([ch, msg]) => (
                          <ChannelBubble key={ch} type={ch} message={msg} side="with" />
                        ))}
                        <div className="mt-4 p-3 rounded-xl bg-accent/10 border border-accent/20">
                           <div className="flex items-center justify-between mb-2">
                             <span className="text-[10px] font-bold text-accent uppercase">Consistency Score</span>
                             <span className="text-xs font-black text-accent">{step.with.consistency}%</span>
                           </div>
                           <div className="h-1.5 w-full bg-accent/20 rounded-full overflow-hidden">
                             <div className="h-full bg-accent transition-all duration-1000" style={{ width: `${step.with.consistency}%` }} />
                           </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-theme-surface border border-theme-border border-l-4 border-l-accent">
                        <p className="text-sm font-medium mb-1">{step.with.action}</p>
                        {step.with.languages && (
                          <div className="flex flex-wrap gap-2 my-2">
                            {step.with.languages.map(l => (
                              <span key={l} className="text-[10px] bg-accent/10 text-accent px-2 py-1 rounded-full border border-accent/20">{l}</span>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-accent font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> {step.with.result}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sim Controls */}
          <div className="flex items-center justify-center gap-3">
            <button 
              onClick={() => setSimState(simState === 'running' ? 'paused' : 'running')}
              className="p-3 rounded-full bg-theme-surface border border-theme-border hover:border-accent transition-all"
            >
              {simState === 'running' ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
            </button>
            <button 
              onClick={() => { setCurrentStep(scenario.steps.length - 1); setSimState('complete'); }}
              className="p-3 rounded-full bg-theme-surface border border-theme-border hover:border-accent transition-all"
              title="Skip to Results"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ImpactCard({ title, without, with: withVal, gain }) {
  return (
    <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-accent transition-colors">
      <div className="text-[10px] font-black text-theme-muted uppercase tracking-[0.2em] mb-4">{title}</div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-red-500 font-bold">Without UACS</span>
          <span className="text-lg font-black text-theme-dim">{without}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-accent font-bold">With UACS</span>
          <span className="text-2xl font-black text-accent">{withVal}</span>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-theme-border">
        <div className="text-xs font-bold text-accent animate-pulse">{gain}</div>
      </div>
    </div>
  );
}

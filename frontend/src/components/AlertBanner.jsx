import { AlertTriangle, Info, AlertOctagon, Megaphone } from 'lucide-react';

const URGENCY_CONFIG = {
  low:      { label: 'LOW',      icon: Info,          bg: 'rgba(34,197,94,0.15)',  color: '#22c55e', border: 'rgba(34,197,94,0.25)' },
  medium:   { label: 'MEDIUM',   icon: Megaphone,     bg: 'rgba(234,179,8,0.15)',  color: '#ca8a04', border: 'rgba(234,179,8,0.25)' },
  high:     { label: 'HIGH',     icon: AlertTriangle,  bg: 'rgba(249,115,22,0.15)', color: '#ea580c', border: 'rgba(249,115,22,0.25)' },
  critical: { label: 'CRITICAL', icon: AlertOctagon,   bg: 'rgba(239,68,68,0.15)',  color: '#ef4444', border: 'rgba(239,68,68,0.25)' },
};

export default function AlertBanner({ urgency }) {
  const cfg = URGENCY_CONFIG[urgency] || URGENCY_CONFIG.low;
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

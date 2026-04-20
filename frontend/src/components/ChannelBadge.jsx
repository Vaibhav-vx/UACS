import { MessageSquare, AtSign, Radio, Tv, Globe } from 'lucide-react';

const CHANNEL_CONFIG = {
  sms:     { label: 'SMS',     icon: MessageSquare, color: 'bg-blue-500/20 text-blue-400 border-blue-500/20' },
  twitter: { label: 'Twitter', icon: AtSign,        color: 'bg-sky-500/20 text-sky-400 border-sky-500/20' },
  radio:   { label: 'Radio',   icon: Radio,         color: 'bg-orange-500/20 text-orange-400 border-orange-500/20' },
  tv:      { label: 'TV',      icon: Tv,            color: 'bg-purple-500/20 text-purple-400 border-purple-500/20' },
  website: { label: 'Website', icon: Globe,         color: 'bg-green-500/20 text-green-400 border-green-500/20' },
};

export default function ChannelBadge({ channel, size = 'sm' }) {
  const ch = CHANNEL_CONFIG[channel?.toLowerCase()] || { label: channel, icon: Globe, color: '' };
  const Icon = ch.icon;
  const cls = size === 'lg'
    ? 'px-3 py-1.5 text-sm rounded-lg gap-2'
    : 'px-2 py-0.5 text-[11px] rounded-md gap-1';
  return (
    <span className={`inline-flex items-center font-bold uppercase tracking-wider border ${cls} ${ch.color}`}>
      <Icon className={size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} /> {ch.label}
    </span>
  );
}

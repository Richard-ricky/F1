import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Zap, Flag, AlertTriangle, Clock, X } from 'lucide-react';

// Accept both 'fastest_lap' (OpenF1 style) and 'fastest-lap' (legacy)
type RawEventType = 'overtake' | 'pitstop' | 'incident' | 'fastest_lap' | 'fastest-lap';

interface RaceEvent {
  id: string;
  type: RawEventType;
  title: string;
  timestamp: string;
  lap: number;
}

interface LiveNotificationsProps {
  events: RaceEvent[];
}

const EVENT_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  overtake:     { icon: Zap,           color: '#fbbf24', bg: 'rgba(251,191,36,0.1)'  },
  pitstop:      { icon: Flag,          color: '#3b82f6', bg: 'rgba(59,130,246,0.1)'  },
  incident:     { icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.1)'   },
  fastest_lap:  { icon: Clock,         color: '#a855f7', bg: 'rgba(168,85,247,0.1)'  },
  'fastest-lap':{ icon: Clock,         color: '#a855f7', bg: 'rgba(168,85,247,0.1)'  },
};

const FALLBACK_CONFIG = { icon: Zap, color: '#ffffff', bg: 'rgba(255,255,255,0.08)' };

export default function LiveNotifications({ events }: LiveNotificationsProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visibleEvents = events
    .filter(e => !dismissed.has(e.id))
    .slice(0, 3);

  return (
    <div className="fixed bottom-6 left-6 space-y-2 z-50 pointer-events-none">
      <AnimatePresence>
        {visibleEvents.map(event => {
          const config = EVENT_CONFIG[event.type] ?? FALLBACK_CONFIG;
          const Icon   = config.icon;

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -80, scale: 0.95 }}
              animate={{ opacity: 1, x: 0,   scale: 1    }}
              exit={{    opacity: 0, x: -80, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg min-w-72 pointer-events-auto"
              style={{
                background: `linear-gradient(to right, ${config.bg}, rgba(0,0,0,0.92))`,
                border: `1px solid ${config.color}40`,
                backdropFilter: 'blur(14px)',
                boxShadow: `0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px ${config.color}15`,
              }}
            >
              <Icon className="w-4 h-4 shrink-0" style={{ color: config.color }} />

              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate">{event.title}</div>
                <div className="text-[10px] text-white/50 mt-0.5">
                  Lap {event.lap} · {event.timestamp}
                </div>
              </div>

              <button
                onClick={() => setDismissed(prev => new Set([...prev, event.id]))}
                className="text-white/30 hover:text-white transition-colors shrink-0 ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
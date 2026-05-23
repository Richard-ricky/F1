import { useState, useRef } from 'react';
import { Radio, Play, Pause, Volume2 } from 'lucide-react';
import type { RadioMessage } from '../hooks/useOpenF1';

interface RadioFeedProps {
  messages: RadioMessage[];
}

export default function RadioFeed({ messages }: RadioFeedProps) {
  const [playing, setPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function togglePlay(msg: RadioMessage) {
    if (playing === msg.id) {
      audioRef.current?.pause();
      setPlaying(null);
      return;
    }
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(msg.url);
    audio.onended = () => setPlaying(null);
    audio.play().catch(() => {});
    audioRef.current = audio;
    setPlaying(msg.id);
  }

  if (!messages.length) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2">
        <Radio className="w-8 h-8 text-white/20" />
        <div className="text-xs text-white/30">No radio messages yet</div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {messages.slice(0, 12).map(msg => {
        const isPlaying = playing === msg.id;
        return (
          <div key={msg.id}
            className="flex items-center gap-3 px-4 py-2.5 border-b border-white/5 hover:bg-white/3 transition-colors">
            {/* Play button */}
            <button onClick={() => togglePlay(msg)}
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all"
              style={{
                background: isPlaying ? msg.teamColor : 'rgba(255,255,255,0.06)',
                border: `1px solid ${isPlaying ? msg.teamColor : 'rgba(255,255,255,0.12)'}`,
              }}>
              {isPlaying
                ? <Pause  className="w-3.5 h-3.5 text-black" />
                : <Play   className="w-3 h-3 text-white/70 ml-0.5" />
              }
            </button>

            <div className="flex-1 min-w-0">
              {/* Driver badge */}
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded"
                  style={{ background:`${msg.teamColor}25`, color:msg.teamColor }}>
                  {msg.driverAbbr}
                </span>
                <span className="text-[9px] text-white/30">
                  {new Date(msg.date).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit',second:'2-digit'})}
                </span>
              </div>

              {/* Waveform visual */}
              {isPlaying && (
                <div className="flex items-center gap-0.5 h-3">
                  {Array.from({length:12}).map((_,i) => (
                    <div key={i} className="w-0.5 rounded-full animate-pulse"
                      style={{
                        background: msg.teamColor,
                        height: `${30 + Math.random()*70}%`,
                        animationDelay:`${i*0.07}s`,
                      }}
                    />
                  ))}
                </div>
              )}
              {!isPlaying && (
                <div className="text-[9px] text-white/30 flex items-center gap-1">
                  <Volume2 className="w-3 h-3" /> Team radio clip
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
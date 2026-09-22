import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Headphones, Play, Pause, Volume2 } from 'lucide-react';

const PRESETS = [
  { label: 'Deep Focus', freq: 45, base: 200, color: '#8b5cf6', desc: '45 Hz Gamma' },
  { label: 'Learning', freq: 40, base: 200, color: '#3b82f6', desc: '40 Hz Gamma' },
  { label: 'Alertness', freq: 14, base: 200, color: '#10b981', desc: '14 Hz Beta' },
  { label: 'Relaxation', freq: 10, base: 200, color: '#f59e0b', desc: '10 Hz Alpha' },
];

const BinauralBeatsPlayer = () => {
  const [playing, setPlaying] = useState(false);
  const [activePreset, setActivePreset] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const audioCtxRef = useRef(null);
  const oscLRef = useRef(null);
  const oscRRef = useRef(null);
  const gainRef = useRef(null);
  const timerRef = useRef(null);

  const startAudio = () => {
    if (audioCtxRef.current) return;

    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = ctx;

    const preset = PRESETS[activePreset];
    const gain = ctx.createGain();
    gain.gain.value = 0.15;
    gain.connect(ctx.destination);
    gainRef.current = gain;

    // Create stereo merger
    const merger = ctx.createChannelMerger(2);
    merger.connect(gain);

    // Left oscillator
    const oscL = ctx.createOscillator();
    oscL.type = 'sine';
    oscL.frequency.value = preset.base;
    oscL.connect(merger, 0, 0);
    oscLRef.current = oscL;

    // Right oscillator (offset by binaural freq)
    const oscR = ctx.createOscillator();
    oscR.type = 'sine';
    oscR.frequency.value = preset.base + preset.freq;
    oscR.connect(merger, 0, 1);
    oscRRef.current = oscR;

    oscL.start();
    oscR.start();

    setPlaying(true);
    timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
  };

  const stopAudio = () => {
    try {
      oscLRef.current?.stop();
      oscRRef.current?.stop();
      audioCtxRef.current?.close();
    } catch (e) { /* ignore */ }
    oscLRef.current = null;
    oscRRef.current = null;
    audioCtxRef.current = null;
    gainRef.current = null;
    clearInterval(timerRef.current);
    setPlaying(false);
    setElapsed(0);
  };

  const togglePlay = () => {
    if (playing) stopAudio();
    else startAudio();
  };

  const changePreset = (idx) => {
    if (playing) stopAudio();
    setActivePreset(idx);
  };

  // Cleanup on unmount
  useEffect(() => () => stopAudio(), []);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const preset = PRESETS[activePreset];

  return (
    <section className="glass-morphism rounded-md p-6 relative overflow-hidden">
      <div className="absolute -right-8 -bottom-8 opacity-5">
        <Headphones size={120} />
      </div>

      <h2 className="text-lg font-bold mb-4 flex items-center gap-2 relative z-10">
        <Headphones className="text-purple-500" size={20} /> Binaural Beats
      </h2>

      {/* Preset Buttons */}
      <div className="grid grid-cols-2 gap-2 mb-5 relative z-10">
        {PRESETS.map((p, i) => (
          <button
            key={i}
            onClick={() => changePreset(i)}
            className={`p-3 rounded-md text-left transition-all duration-200 border ${
              activePreset === i
                ? 'border-primary/50 bg-primary/10 shadow-sm'
                : 'border-border/50 bg-background/50 hover:border-primary/30'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
              <span className="text-xs font-bold text-foreground">{p.label}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">{p.desc}</span>
          </button>
        ))}
      </div>

      {/* Waveform + Controls */}
      <div className="flex items-center gap-4 relative z-10">
        <button
          onClick={togglePlay}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md ${
            playing
              ? 'bg-destructive text-destructive-foreground hover:opacity-90'
              : 'bg-primary text-primary-foreground hover:opacity-90'
          }`}
        >
          {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
        </button>

        <div className="flex-1">
          {/* Animated waveform bars */}
          <div className="flex items-end gap-[3px] h-8">
            {Array.from({ length: 16 }).map((_, i) => (
              <motion.div
                key={i}
                className="flex-1 rounded-full"
                style={{ background: preset.color }}
                animate={{
                  height: playing
                    ? [8, 20 + Math.random() * 12, 8]
                    : 4,
                }}
                transition={{
                  duration: playing ? 0.6 + Math.random() * 0.4 : 0.3,
                  repeat: playing ? Infinity : 0,
                  delay: i * 0.04,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-muted-foreground font-medium">
              {playing ? preset.label : 'Ready'}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              {formatTime(elapsed)}
            </span>
          </div>
        </div>

        <Volume2 size={16} className="text-muted-foreground" />
      </div>

      {playing && (
        <p className="text-[10px] text-muted-foreground mt-3 text-center italic relative z-10">Use headphones for best binaural effect
        </p>
      )}
    </section>
  );
};

export default BinauralBeatsPlayer;

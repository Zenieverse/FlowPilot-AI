import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { Settings, Save, RotateCcw, Sliders, Mic2, Cpu, Zap, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface Props {
  settings: AppSettings;
  onSave: (settings: AppSettings) => Promise<void>;
}

export const SettingsView: React.FC<Props> = ({ settings: initialSettings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalSettings(initialSettings);
  }, [initialSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(localSettings);
    setIsSaving(false);
    setHasChanges(false);
  };

  const updateSetting = (key: keyof AppSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  return (
    <div className="h-full glass rounded-3xl overflow-hidden flex flex-col border border-white/5">
      <div className="p-8 border-b border-white/10 bg-white/5 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-brand-primary/10 text-brand-primary">
            <Settings size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-white">Neural Configuration</h2>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">System Parameters & Agent Tuning</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => {
              setLocalSettings(initialSettings);
              setHasChanges(false);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl glass hover:bg-white/10 transition-all text-xs font-medium text-slate-400"
          >
            <RotateCcw size={14} />
            Reset
          </button>
          <button 
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-xl transition-all text-xs font-bold uppercase tracking-widest",
              hasChanges 
                ? "bg-brand-primary text-bg-dark shadow-[0_0_20px_rgba(0,255,148,0.3)] hover:scale-105" 
                : "bg-slate-800 text-slate-500 cursor-not-allowed"
            )}
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {isSaving ? "Syncing..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Agent Sensitivity */}
          <div className="space-y-6 p-6 glass rounded-2xl border border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <Sliders size={18} className="text-purple-400" />
              <h3 className="font-display font-bold">Agent Sensitivity</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs text-slate-400">Temperature (Creativity)</label>
                <span className="text-xs font-mono text-brand-primary">{localSettings.agent_sensitivity}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1"
                value={localSettings.agent_sensitivity}
                onChange={(e) => updateSetting('agent_sensitivity', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-primary"
              />
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Higher values result in more creative but potentially less predictable agent behavior.
              </p>
            </div>
          </div>

          {/* Voice Synthesis */}
          <div className="space-y-6 p-6 glass rounded-2xl border border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <Mic2 size={18} className="text-brand-secondary" />
              <h3 className="font-display font-bold">Voice Synthesis</h3>
            </div>
            <div className="space-y-4">
              <label className="text-xs text-slate-400 block">Neural Voice Profile</label>
              <div className="grid grid-cols-2 gap-2">
                {['Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir'].map((voice) => (
                  <button
                    key={voice}
                    onClick={() => updateSetting('voice_name', voice)}
                    className={cn(
                      "px-4 py-2 rounded-xl border text-[10px] font-mono uppercase tracking-widest transition-all",
                      localSettings.voice_name === voice 
                        ? "bg-brand-secondary/20 border-brand-secondary text-brand-secondary" 
                        : "bg-white/5 border-white/10 text-slate-500 hover:border-white/20"
                    )}
                  >
                    {voice}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Autonomous Parameters */}
          <div className="space-y-6 p-6 glass rounded-2xl border border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <Cpu size={18} className="text-brand-primary" />
              <h3 className="font-display font-bold">Autonomous Parameters</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs text-slate-400">Max Reasoning Steps</label>
                <span className="text-xs font-mono text-brand-primary">{localSettings.max_steps}</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="20" 
                step="1"
                value={localSettings.max_steps}
                onChange={(e) => updateSetting('max_steps', parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-primary"
              />
              <div className="flex items-center justify-between pt-2">
                <label className="text-xs text-slate-400">Autonomous Mode</label>
                <button 
                  onClick={() => updateSetting('autonomous_mode', !localSettings.autonomous_mode)}
                  className={cn(
                    "w-10 h-5 rounded-full relative transition-colors duration-300",
                    localSettings.autonomous_mode ? "bg-brand-primary" : "bg-slate-800"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300",
                    localSettings.autonomous_mode ? "left-6" : "left-1"
                  )} />
                </button>
              </div>
            </div>
          </div>

          {/* System Protocol */}
          <div className="space-y-6 p-6 glass rounded-2xl border border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <Zap size={18} className="text-yellow-400" />
              <h3 className="font-display font-bold">System Protocol</h3>
            </div>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400">ENCRYPTION</span>
                <span className="text-[10px] font-mono text-brand-primary">AES-256 ACTIVE</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400">NEURAL LINK</span>
                <span className="text-[10px] font-mono text-brand-primary">STABLE</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400">LATENCY OPTIMIZATION</span>
                <span className="text-[10px] font-mono text-brand-primary">ENABLED</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

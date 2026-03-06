import React, { useEffect, useRef, useState } from 'react';
import { LogEntry } from '../types';
import { cn } from '../lib/utils';
import { Bot, User, Zap, Brain, Database, Trash2, Copy, Filter, Check, Mic } from 'lucide-react';

interface Props {
  logs: LogEntry[];
  onClear?: () => void;
}

export const ActivityLog: React.FC<Props> = ({ logs, onClear }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0; // Since we prepend logs, top is newest
    }
  }, [logs]);

  const getAgentIcon = (agent: string) => {
    const a = agent.toLowerCase();
    if (a.includes('lite')) return <Brain size={14} className="text-purple-400" />;
    if (a.includes('act')) return <Zap size={14} className="text-brand-primary" />;
    if (a.includes('multimodal')) return <Database size={14} className="text-brand-secondary" />;
    if (a.includes('sonic')) return <Mic size={14} className="text-brand-primary" />;
    if (a === 'user') return <User size={14} className="text-slate-400" />;
    return <Bot size={14} className="text-slate-400" />;
  };

  const filteredLogs = filter 
    ? logs.filter(l => l.agent.toLowerCase() === filter.toLowerCase())
    : logs;

  const copyToClipboard = () => {
    const text = logs.map(l => `[${l.agent}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full glass rounded-2xl overflow-hidden border border-white/5">
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
        <div className="flex items-center gap-4">
          <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-slate-400">Neural Activity Log</h3>
          <div className="flex gap-2">
            {['NOVA-LITE', 'NOVA-ACT', 'NOVA-MULTIMODAL'].map(agent => (
              <button
                key={agent}
                onClick={() => setFilter(filter === agent ? null : agent)}
                className={cn(
                  "px-2 py-0.5 rounded text-[9px] font-mono border transition-all",
                  filter === agent 
                    ? "bg-brand-primary/20 border-brand-primary text-brand-primary" 
                    : "bg-white/5 border-white/10 text-slate-500 hover:text-slate-300"
                )}
              >
                {agent}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={copyToClipboard}
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
            title="Copy Logs"
          >
            {copied ? <Check size={14} className="text-brand-primary" /> : <Copy size={14} />}
          </button>
          <button 
            onClick={onClear}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
            title="Clear Logs"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-[11px] scroll-smooth">
        {filteredLogs.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 italic gap-2">
            <Filter size={24} className="opacity-20" />
            <p>{filter ? `No activity found for ${filter}` : 'Waiting for neural activity...'}</p>
          </div>
        )}
        {filteredLogs.map((log) => (
          <div key={log.id} className="flex gap-3 group animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                "p-1.5 rounded-lg bg-white/5 border border-white/10 group-hover:border-white/20 transition-colors",
                log.agent === 'PLANNER' && "border-purple-500/30",
                log.agent === 'EXECUTOR' && "border-brand-primary/30",
                log.agent === 'KNOWLEDGE' && "border-brand-secondary/30"
              )}>
                {getAgentIcon(log.agent)}
              </div>
              <div className="w-px h-full bg-white/5" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex justify-between items-center">
                <span className={cn(
                  "uppercase tracking-tighter font-bold",
                  log.agent === 'PLANNER' && "text-purple-400",
                  log.agent === 'EXECUTOR' && "text-brand-primary",
                  log.agent === 'KNOWLEDGE' && "text-brand-secondary",
                  log.agent === 'USER' && "text-slate-400"
                )}>
                  {log.agent}
                </span>
                <span className="text-slate-600 text-[9px]">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed selection:bg-brand-primary/30">
                {log.message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

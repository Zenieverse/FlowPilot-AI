import React from 'react';
import { LogEntry } from '../types';
import { cn } from '../lib/utils';
import { Bot, User, Zap, Brain, Database } from 'lucide-react';

interface Props {
  logs: LogEntry[];
}

export const ActivityLog: React.FC<Props> = ({ logs }) => {
  const getAgentIcon = (agent: string) => {
    switch (agent.toLowerCase()) {
      case 'planner': return <Brain size={14} className="text-purple-400" />;
      case 'executor': return <Zap size={14} className="text-brand-primary" />;
      case 'knowledge': return <Database size={14} className="text-brand-secondary" />;
      case 'user': return <User size={14} className="text-slate-400" />;
      default: return <Bot size={14} className="text-slate-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full glass rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-white/10 flex justify-between items-center">
        <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-slate-400">Neural Activity Log</h3>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
          <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary" />
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-[11px]">
        {logs.length === 0 && (
          <div className="h-full flex items-center justify-center text-slate-600 italic">
            Waiting for neural activity...
          </div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 group">
            <div className="flex flex-col items-center gap-1">
              <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 group-hover:border-white/20 transition-colors">
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
              <p className="text-slate-300 leading-relaxed">
                {log.message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

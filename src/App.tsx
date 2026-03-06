import React, { useState, useEffect } from 'react';
import { VoiceAssistant } from './components/VoiceAssistant';
import { WorkflowVisualizer } from './components/WorkflowVisualizer';
import { ActivityLog } from './components/ActivityLog';
import { FlowPilotOrchestrator } from './lib/agents';
import { Task, LogEntry, WorkflowNode, WorkflowEdge } from './types';
import { LayoutDashboard, History, Settings, Shield, Cpu, Globe, FileText } from 'lucide-react';
import { cn } from './lib/utils';

export default function App() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState<string>('Idle');
  
  const [nodes, setNodes] = useState<WorkflowNode[]>([
    { id: 'v', label: 'Voice', type: 'voice', status: 'idle' },
    { id: 'p', label: 'Planner', type: 'planner', status: 'idle' },
    { id: 'e', label: 'Executor', type: 'executor', status: 'idle' },
    { id: 'k', label: 'Knowledge', type: 'knowledge', status: 'idle' },
  ]);

  const edges: WorkflowEdge[] = [
    { source: 'v', target: 'p' },
    { source: 'p', target: 'e' },
    { source: 'e', target: 'k' },
    { source: 'k', target: 'p' },
  ];

  const addLog = (agent: string, message: string) => {
    const newLog: LogEntry = {
      id: Date.now(),
      task_id: 'current',
      agent,
      message,
      timestamp: new Date().toISOString()
    };
    setLogs(prev => [newLog, ...prev]);

    // Update node status based on agent
    setNodes(prev => prev.map(n => {
      if (n.type === agent.toLowerCase()) return { ...n, status: 'active' };
      return { ...n, status: n.status === 'active' ? 'done' : n.status };
    }));
  };

  const handleTranscript = async (text: string, isUser: boolean) => {
    if (isUser) {
      const orchestrator = new FlowPilotOrchestrator(addLog, setStatus);
      await orchestrator.processRequest(text);
    }
  };

  return (
    <div className="flex h-screen bg-bg-dark text-slate-200 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-20 flex flex-col items-center py-8 border-r border-white/5 bg-black/20">
        <div className="w-12 h-12 rounded-2xl bg-brand-primary flex items-center justify-center mb-12 shadow-[0_0_20px_rgba(0,255,148,0.4)]">
          <Cpu className="text-bg-dark" size={24} />
        </div>
        
        <nav className="flex-1 flex flex-col gap-8">
          <button className="p-3 rounded-xl bg-white/5 text-brand-primary border border-brand-primary/20"><LayoutDashboard size={20} /></button>
          <button className="p-3 rounded-xl text-slate-500 hover:text-slate-300 transition-colors"><History size={20} /></button>
          <button className="p-3 rounded-xl text-slate-500 hover:text-slate-300 transition-colors"><Globe size={20} /></button>
          <button className="p-3 rounded-xl text-slate-500 hover:text-slate-300 transition-colors"><FileText size={20} /></button>
        </nav>

        <div className="mt-auto flex flex-col gap-6">
          <button className="p-3 rounded-xl text-slate-500 hover:text-slate-300 transition-colors"><Shield size={20} /></button>
          <button className="p-3 rounded-xl text-slate-500 hover:text-slate-300 transition-colors"><Settings size={20} /></button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-8 gap-8 overflow-hidden">
        {/* Header */}
        <header className="flex justify-between items-end">
          <div>
            <h1 className="font-display text-4xl font-extrabold tracking-tighter text-white">
              FLOWPILOT <span className="text-brand-primary">AI</span>
            </h1>
            <p className="text-slate-500 font-mono text-xs uppercase tracking-[0.3em] mt-1">Autonomous Workflow Orchestration System</p>
          </div>
          
          <div className="flex gap-4">
            <div className="px-4 py-2 glass rounded-xl flex items-center gap-3">
              <div className={cn("w-2 h-2 rounded-full", status === 'Idle' ? 'bg-slate-500' : 'bg-brand-primary animate-pulse')} />
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">System Status: {status}</span>
            </div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="flex-1 grid grid-cols-12 gap-8 min-h-0">
          {/* Left Column: Voice & Visualization */}
          <div className="col-span-4 flex flex-col gap-8">
            <VoiceAssistant 
              onTranscript={handleTranscript} 
              onStatusChange={setStatus} 
            />
            <div className="flex-1 min-h-0">
              <WorkflowVisualizer nodes={nodes} edges={edges} />
            </div>
          </div>

          {/* Right Column: Activity Log */}
          <div className="col-span-8 flex flex-col gap-8 min-h-0">
            <div className="flex-1 min-h-0">
              <ActivityLog logs={logs} />
            </div>
            
            {/* Quick Stats / Info */}
            <div className="grid grid-cols-3 gap-6">
              {[
                { label: 'Neural Compute', value: '84.2 TFLOPS', color: 'text-brand-primary' },
                { label: 'Active Agents', value: '04', color: 'text-brand-secondary' },
                { label: 'Task Success', value: '99.8%', color: 'text-purple-400' }
              ].map((stat, i) => (
                <div key={i} className="glass p-4 rounded-2xl">
                  <p className="text-[10px] font-display uppercase tracking-widest text-slate-500 mb-1">{stat.label}</p>
                  <p className={cn("text-xl font-bold font-mono", stat.color)}>{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

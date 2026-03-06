import React, { useState, useEffect } from 'react';
import { VoiceAssistant } from './components/VoiceAssistant';
import { WorkflowVisualizer } from './components/WorkflowVisualizer';
import { ActivityLog } from './components/ActivityLog';
import { TaskHistory } from './components/TaskHistory';
import { DocumentManager } from './components/DocumentManager';
import { NotificationCenter } from './components/NotificationCenter';
import { UserProfile } from './components/UserProfile';
import { FlowPilotOrchestrator } from './lib/agents';
import { Task, LogEntry, WorkflowNode, WorkflowEdge } from './types';
import { LayoutDashboard, History, Settings, Shield, Cpu, Globe, FileText, Bell, Search, User } from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

type View = 'dashboard' | 'history' | 'knowledge' | 'settings';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [status, setStatus] = useState<string>('Idle');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredLogs = logs.filter(log => 
    log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.agent.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
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
      task_id: selectedTaskId || 'current',
      agent,
      message,
      timestamp: new Date().toISOString()
    };
    setLogs(prev => [newLog, ...prev]);

    setNodes(prev => prev.map(n => {
      if (n.type === agent.toLowerCase()) return { ...n, status: 'active' };
      return { ...n, status: n.status === 'active' ? 'done' : n.status };
    }));
  };

  const handleTranscript = async (text: string, isUser: boolean) => {
    if (isUser) {
      setLogs([]); // Clear logs for new task
      setCurrentView('dashboard');
      const orchestrator = new FlowPilotOrchestrator(addLog, setStatus);
      await orchestrator.processRequest(text);
    }
  };

  const loadTaskLogs = async (taskId: string) => {
    setSelectedTaskId(taskId);
    try {
      const res = await fetch(`/api/logs/${taskId}`);
      const data = await res.json();
      setLogs(data.reverse());
      setCurrentView('dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-screen bg-bg-dark text-slate-200 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-20 flex flex-col items-center py-8 border-r border-white/5 bg-black/40 z-20">
        <div className="w-12 h-12 rounded-2xl bg-brand-primary flex items-center justify-center mb-12 shadow-[0_0_20px_rgba(0,255,148,0.4)] cursor-pointer hover:scale-105 transition-transform">
          <Cpu className="text-bg-dark" size={24} />
        </div>
        
        <nav className="flex-1 flex flex-col gap-6">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'history', icon: History, label: 'History' },
            { id: 'knowledge', icon: FileText, label: 'Knowledge' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as View)}
              className={cn(
                "p-3 rounded-xl transition-all duration-300 relative group",
                currentView === item.id 
                  ? "bg-brand-primary/10 text-brand-primary border border-brand-primary/20" 
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              )}
            >
              <item.icon size={20} />
              <span className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-6">
          <button 
            onClick={() => setCurrentView('settings')}
            className={cn(
              "p-3 rounded-xl transition-all duration-300 group relative",
              currentView === 'settings' ? "text-brand-primary" : "text-slate-500 hover:text-slate-300"
            )}
          >
            <Settings size={20} />
          </button>
          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden cursor-pointer hover:border-brand-primary/50 transition-colors">
            <User size={18} className="text-slate-400" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-8 gap-8 overflow-hidden relative">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-primary/5 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-brand-secondary/5 blur-[100px] rounded-full -ml-32 -mb-32 pointer-events-none" />

        {/* Header */}
        <header className="flex justify-between items-center z-10">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-4xl font-extrabold tracking-tighter text-white"
            >
              FLOWPILOT <span className="text-brand-primary">AI</span>
            </motion.h1>
            <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.4em] mt-1">Autonomous Neural Orchestration v1.0.4</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 glass rounded-full text-slate-400 focus-within:border-brand-primary/50 transition-all">
              <Search size={14} />
              <input 
                type="text" 
                placeholder="Search neural logs..." 
                className="bg-transparent border-none outline-none text-xs w-48"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-4">
              <NotificationCenter />
              <div className="h-8 w-px bg-white/10" />
              <div className="px-4 py-2 glass rounded-xl flex items-center gap-3">
                <div className={cn(
                  "w-2 h-2 rounded-full shadow-[0_0_8px]",
                  status === 'Idle' ? 'bg-slate-500 shadow-slate-500/50' : 'bg-brand-primary shadow-brand-primary/50 animate-pulse'
                )} />
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">CORE: {status}</span>
              </div>
              <UserProfile />
            </div>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 min-h-0 z-10">
          <AnimatePresence mode="wait">
            {currentView === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="h-full grid grid-cols-12 gap-8"
              >
                <div className="col-span-4 flex flex-col gap-8">
                  <VoiceAssistant 
                    onTranscript={handleTranscript} 
                    onStatusChange={setStatus} 
                  />
                  <div className="flex-1 min-h-0">
                    <WorkflowVisualizer nodes={nodes} edges={edges} />
                  </div>
                </div>
                <div className="col-span-8 flex flex-col gap-8 min-h-0">
                  <div className="flex-1 min-h-0">
                    <ActivityLog 
                      logs={filteredLogs} 
                      onClear={() => setLogs([])}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    {[
                      { label: 'Neural Compute', value: '84.2 TFLOPS', color: 'text-brand-primary' },
                      { label: 'Active Agents', value: '04', color: 'text-brand-secondary' },
                      { label: 'Task Success', value: '99.8%', color: 'text-purple-400' }
                    ].map((stat, i) => (
                      <div key={i} className="glass p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors group">
                        <p className="text-[10px] font-display uppercase tracking-widest text-slate-500 mb-1 group-hover:text-slate-400 transition-colors">{stat.label}</p>
                        <p className={cn("text-2xl font-bold font-mono", stat.color)}>{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Custom Templates Section */}
                  <div className="glass p-6 rounded-3xl border border-white/5">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-display font-bold text-lg">Automation Templates</h3>
                      <button className="text-[10px] font-mono text-brand-primary uppercase tracking-widest hover:underline">Create Custom +</button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { title: 'Web Research & Report', desc: 'Search web, analyze data, and generate a PDF report.', icon: Globe },
                        { title: 'Document Synthesis', desc: 'Process multiple documents and extract key insights.', icon: FileText },
                      ].map((tmpl, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-brand-primary/30 transition-all cursor-pointer group">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-white/5 text-slate-400 group-hover:text-brand-primary transition-colors">
                              <tmpl.icon size={18} />
                            </div>
                            <h4 className="text-sm font-semibold">{tmpl.title}</h4>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed">{tmpl.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentView === 'history' && (
              <motion.div 
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full"
              >
                <TaskHistory onSelectTask={loadTaskLogs} />
              </motion.div>
            )}

            {currentView === 'knowledge' && (
              <motion.div 
                key="knowledge"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full"
              >
                <DocumentManager />
              </motion.div>
            )}

            {currentView === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full glass rounded-3xl p-12 flex flex-col items-center justify-center text-center gap-6"
              >
                <div className="p-6 rounded-full bg-white/5 text-slate-400">
                  <Settings size={64} />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold">Neural Configuration</h2>
                  <p className="text-slate-500 mt-2 max-w-md">Customize your FlowPilot experience, manage API connections, and configure autonomous agent parameters.</p>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full max-w-lg mt-8">
                  <button className="p-4 glass rounded-2xl border border-white/10 hover:border-brand-primary/50 transition-all text-sm font-medium">Agent Sensitivity</button>
                  <button className="p-4 glass rounded-2xl border border-white/10 hover:border-brand-primary/50 transition-all text-sm font-medium">Voice Synthesis</button>
                  <button className="p-4 glass rounded-2xl border border-white/10 hover:border-brand-primary/50 transition-all text-sm font-medium">OAuth Connections</button>
                  <button className="p-4 glass rounded-2xl border border-white/10 hover:border-brand-primary/50 transition-all text-sm font-medium">System Logs</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

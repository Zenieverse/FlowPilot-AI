import React, { useState, useEffect } from 'react';
import { Task, LogEntry } from '../types';
import { History, Trash2, ChevronRight, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  onSelectTask: (taskId: string) => void;
}

export const TaskHistory: React.FC<Props> = ({ onSelectTask }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);
  }, []);

  const deleteTask = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    fetchTasks();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 size={16} className="text-brand-primary" />;
      case 'failed': return <AlertCircle size={16} className="text-red-400" />;
      case 'executing':
      case 'planning': return <Loader2 size={16} className="text-brand-secondary animate-spin" />;
      default: return <Clock size={16} className="text-slate-500" />;
    }
  };

  return (
    <div className="flex flex-col h-full glass rounded-3xl overflow-hidden">
      <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
            <History size={20} />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg">Task History</h3>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Neural Execution Archive</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="animate-spin text-brand-primary" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
            <div className="p-4 rounded-full bg-white/5">
              <History size={32} className="opacity-20" />
            </div>
            <p className="text-sm italic">No tasks recorded yet</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => onSelectTask(task.id)}
              className="group p-4 glass rounded-2xl hover:bg-white/10 transition-all cursor-pointer border border-white/5 hover:border-white/20"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-shrink-0">
                    {getStatusIcon(task.status)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-medium text-sm text-slate-200 truncate group-hover:text-white transition-colors">
                      {task.title}
                    </h4>
                    <p className="text-[10px] font-mono text-slate-500">
                      {new Date(task.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => deleteTask(e, task.id)}
                    className="p-2 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                  <ChevronRight size={14} className="text-slate-600" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

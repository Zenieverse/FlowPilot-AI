import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Task {
  id: string;
  title: string;
  status: 'pending' | 'planning' | 'executing' | 'completed' | 'failed';
  created_at: string;
}

export interface LogEntry {
  id: number;
  task_id: string;
  agent: string;
  message: string;
  timestamp: string;
}

export interface WorkflowNode {
  id: string;
  label: string;
  type: 'planner' | 'executor' | 'knowledge' | 'voice';
  status: 'idle' | 'active' | 'done' | 'error';
}

export interface WorkflowEdge {
  source: string;
  target: string;
}

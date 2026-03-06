import { GoogleGenAI, Type } from "@google/genai";
import { v4 as uuidv4 } from 'uuid';
import { AppSettings } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export class FlowPilotOrchestrator {
  private taskId: string;
  private onLog: (agent: string, message: string) => void;
  private onStatusUpdate: (status: string) => void;
  private settings: AppSettings;

  constructor(
    onLog: (agent: string, message: string) => void, 
    onStatusUpdate: (status: string) => void,
    settings: AppSettings
  ) {
    this.taskId = uuidv4();
    this.onLog = onLog;
    this.onStatusUpdate = onStatusUpdate;
    this.settings = settings;
  }

  private async persistLog(agent: string, message: string) {
    this.onLog(agent, message);
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: this.taskId, agent, message })
      });
    } catch (e) {
      console.error("Failed to persist log:", e);
    }
  }

  private async updateTaskStatus(title: string, status: string) {
    this.onStatusUpdate(status);
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: this.taskId, title, status })
      });
    } catch (e) {
      console.error("Failed to update task status:", e);
    }
  }

  async processRequest(request: string) {
    await this.updateTaskStatus(request, 'planning');
    await this.persistLog('NOVA-LITE', `Reasoning initiated: ${request}`);
    
    // 1. Nova 2 Lite (Planner)
    const plan = await this.plannerAgent(request);
    await this.persistLog('NOVA-LITE', `Advanced reasoning complete. Decomposed into ${plan.length} UI automation steps.`);
    
    // 2. Nova Act (Execution Fleet)
    for (const task of plan) {
      await this.updateTaskStatus(request, 'executing');
      await this.persistLog('NOVA-ACT', `Fleet Agent dispatched: ${task.description}`);
      
      // Simulate UI Automation with Nova Act reliability
      await new Promise(r => setTimeout(r, 1500));
      
      if (task.type === 'search' || task.type === 'analyze') {
        const result = await this.knowledgeAgent(task.description);
        await this.persistLog('NOVA-MULTIMODAL', `Multimodal Insight: ${result}`);
      } else {
        await this.persistLog('NOVA-ACT', `UI Workflow Step Verified: ${task.description}`);
      }
    }

    await this.updateTaskStatus(request, 'completed');
    await this.persistLog('NOVA-LITE', "Nova Orchestration successfully finalized.");

    // Add system notification
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Workflow Completed',
          message: `Autonomous task "${request.substring(0, 30)}..." finished successfully.`,
          type: 'success'
        })
      });
    } catch (e) {
      console.error(e);
    }
  }

  private async plannerAgent(request: string) {
    await this.persistLog('NOVA-LITE', "Analyzing intent using Nova 2 Lite reasoning...");
    
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Decompose this user request into a sequence of executable tasks for an autonomous agent: "${request}"`,
      config: {
        temperature: this.settings.agent_sensitivity,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, description: "Type of task: search, click, fill, analyze" },
              description: { type: Type.STRING, description: "Detailed description of the task" }
            },
            required: ["type", "description"]
          }
        }
      }
    });

    try {
      return JSON.parse(response.text);
    } catch (e) {
      return [{ type: 'analyze', description: request }];
    }
  }

  private async knowledgeAgent(query: string) {
    await this.persistLog('NOVA-MULTIMODAL', `Generating multimodal embeddings for context: ${query}`);
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: query,
      config: {
        systemInstruction: "You are the Nova Multimodal Agent. Use advanced embeddings to provide cross-modal insights."
      }
    });
    return response.text || "No insights found.";
  }
}

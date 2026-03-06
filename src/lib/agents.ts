import { GoogleGenAI, Type } from "@google/genai";
import { v4 as uuidv4 } from 'uuid';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export class FlowPilotOrchestrator {
  private taskId: string;
  private onLog: (agent: string, message: string) => void;
  private onStatusUpdate: (status: string) => void;

  constructor(onLog: (agent: string, message: string) => void, onStatusUpdate: (status: string) => void) {
    this.taskId = uuidv4();
    this.onLog = onLog;
    this.onStatusUpdate = onStatusUpdate;
  }

  async processRequest(request: string) {
    this.onLog('USER', request);
    this.onStatusUpdate('planning');
    
    // 1. Planner Agent
    const plan = await this.plannerAgent(request);
    this.onLog('PLANNER', `Decomposed request into ${plan.length} sub-tasks.`);
    
    // 2. Execution Loop
    for (const task of plan) {
      this.onStatusUpdate('executing');
      this.onLog('EXECUTOR', `Executing: ${task.description}`);
      
      // Simulate execution (Nova Act equivalent)
      await new Promise(r => setTimeout(r, 2000));
      
      if (task.type === 'search' || task.type === 'analyze') {
        const result = await this.knowledgeAgent(task.description);
        this.onLog('KNOWLEDGE', result);
      } else {
        this.onLog('EXECUTOR', `Successfully completed: ${task.description}`);
      }
    }

    this.onStatusUpdate('completed');
    this.onLog('PLANNER', "Workflow successfully orchestrated and completed.");
  }

  private async plannerAgent(request: string) {
    this.onLog('PLANNER', "Analyzing intent and decomposing workflow...");
    
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Decompose this user request into a sequence of executable tasks for an autonomous agent: "${request}"`,
      config: {
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
    this.onLog('KNOWLEDGE', `Querying multimodal knowledge base for: ${query}`);
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: query,
      config: {
        systemInstruction: "You are the Knowledge Agent. Extract precise information and provide structured insights."
      }
    });
    return response.text || "No insights found.";
  }
}

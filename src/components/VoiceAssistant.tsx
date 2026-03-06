import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Mic, MicOff, Volume2, VolumeX, Terminal } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  onTranscript?: (text: string, isUser: boolean) => void;
  onStatusChange?: (status: string) => void;
  voiceName?: string;
}

export const VoiceAssistant: React.FC<Props> = ({ onTranscript, onStatusChange, voiceName = "Zephyr" }) => {
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const startSession = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const session = await ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName as any } },
          },
          systemInstruction: "You are FlowPilot AI, powered by Amazon Nova Sonic. You are a speech-to-speech conversational assistant. You help users plan and execute complex UI workflows using Nova Act. Be concise, helpful, and professional.",
        },
        callbacks: {
          onopen: () => {
            setIsActive(true);
            onStatusChange?.('Connected');
            setupAudioInput();
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
              const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
              playAudioResponse(base64Audio);
            }
            
            if (message.serverContent?.modelTurn?.parts[0]?.text) {
              onTranscript?.(message.serverContent.modelTurn.parts[0].text, false);
            }
          },
          onclose: () => {
            setIsActive(false);
            onStatusChange?.('Disconnected');
            cleanupAudio();
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            onStatusChange?.('Error');
          }
        }
      });

      sessionRef.current = session;
    } catch (err) {
      console.error("Failed to connect:", err);
    }
  };

  const setupAudioInput = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContextRef.current = new AudioContext({ sampleRate: 16000 });
    sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
    processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

    processorRef.current.onaudioprocess = (e) => {
      if (isMuted) return;
      
      const inputData = e.inputBuffer.getChannelData(0);
      
      // Calculate audio level for UI
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) {
        sum += inputData[i] * inputData[i];
      }
      setAudioLevel(Math.sqrt(sum / inputData.length));

      // Convert to PCM16
      const pcm16 = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
      }
      
      const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
      sessionRef.current?.sendRealtimeInput({
        media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
      });
    };

    sourceRef.current.connect(processorRef.current);
    processorRef.current.connect(audioContextRef.current.destination);
  };

  const playAudioResponse = async (base64Data: string) => {
    if (!audioContextRef.current) return;
    
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // PCM16 to Float32
    const pcm16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 0x7FFF;
    }

    const buffer = audioContextRef.current.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.start();
  };

  const cleanupAudio = () => {
    sourceRef.current?.disconnect();
    processorRef.current?.disconnect();
    audioContextRef.current?.close();
    audioContextRef.current = null;
  };

  const toggleSession = () => {
    if (isActive) {
      sessionRef.current?.close();
    } else {
      startSession();
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-8 glass rounded-3xl relative overflow-hidden">
      {/* Background Pulse */}
      {isActive && (
        <div 
          className="absolute inset-0 bg-brand-primary/5 animate-pulse pointer-events-none"
          style={{ opacity: audioLevel * 5 }}
        />
      )}

      <div className="relative">
        <button
          onClick={toggleSession}
          className={cn(
            "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl",
            isActive 
              ? "bg-brand-primary text-bg-dark scale-110 neon-glow" 
              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
          )}
        >
          {isActive ? <Mic size={40} /> : <MicOff size={40} />}
        </button>
        
        {isActive && (
          <div className="absolute -inset-4 border-2 border-brand-primary/30 rounded-full animate-ping pointer-events-none" />
        )}
      </div>

      <div className="flex flex-col items-center gap-2">
        <h3 className="font-display text-xl font-semibold tracking-tight">
          {isActive ? "FlowPilot is Listening" : "Start Conversation"}
        </h3>
        <p className="text-slate-500 text-sm font-mono uppercase tracking-widest">
          {isActive ? "Real-time Neural Link Active" : "Click to initialize assistant"}
        </p>
      </div>

      <div className="flex gap-4">
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className="p-3 rounded-xl glass hover:bg-white/10 transition-colors"
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
        <div className="flex items-center gap-1 px-4 py-2 glass rounded-xl">
          <Terminal size={16} className="text-brand-primary" />
          <span className="text-[10px] font-mono text-slate-400">LATENCY: 42ms</span>
        </div>
      </div>
    </div>
  );
};

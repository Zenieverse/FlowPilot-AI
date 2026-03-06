import React, { useState, useEffect, useRef } from 'react';
import { User, LogOut, Shield, CreditCard, ExternalLink, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export const UserProfile: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden cursor-pointer hover:border-brand-primary/50 transition-all group"
      >
        <User size={18} className="text-slate-400 group-hover:text-brand-primary transition-colors" />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-4 w-64 glass rounded-2xl border border-white/10 shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-6 bg-white/5 border-b border-white/10 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-brand-primary/20 border border-brand-primary/30 flex items-center justify-center mb-3">
                <User size={32} className="text-brand-primary" />
              </div>
              <h3 className="font-display font-bold text-white">Neural Pilot</h3>
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Tier: Enterprise Alpha</p>
            </div>

            <div className="p-2 space-y-1">
              {[
                { icon: Shield, label: 'Security Protocol', color: 'text-slate-400' },
                { icon: CreditCard, label: 'Compute Credits', color: 'text-slate-400' },
                { icon: ExternalLink, label: 'API Dashboard', color: 'text-slate-400' },
              ].map((item, i) => (
                <button 
                  key={i}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-xs text-slate-300"
                >
                  <item.icon size={16} className={item.color} />
                  <span>{item.label}</span>
                </button>
              ))}
              
              <div className="h-px bg-white/5 my-1" />
              
              <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 transition-colors text-xs text-red-400">
                <LogOut size={16} />
                <span>Terminate Session</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

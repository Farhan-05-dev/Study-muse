import React from 'react';
import { motion } from 'motion/react';
import { Heart, Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full py-8 px-4 border-t border-white/5 bg-background/50 backdrop-blur-xl relative overflow-hidden">
      {/* Subtle glow accents */}
      <div className="absolute top-0 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
      <div className="absolute top-0 right-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
      
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center gap-2">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-2 group cursor-default"
        >
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 group-hover:border-purple-500/30 group-hover:bg-purple-500/5 transition-all duration-500">
            <span className="text-xs font-medium text-slate-400 group-hover:text-slate-200 transition-colors">
              Powered by AI
            </span>
            <Sparkles className="w-3 h-3 text-cyan-400 group-hover:text-purple-400 transition-colors animate-pulse" />
            <span className="text-slate-600">•</span>
            <span className="text-xs font-medium text-slate-400 group-hover:text-slate-200 transition-colors">
              Built by Farhan
            </span>
            <Heart className="w-3 h-3 text-red-500/50 group-hover:text-red-500 transition-all duration-300 group-hover:scale-110" />
          </div>
        </motion.div>
        
        <div className="flex items-center gap-4 mt-2">
          <div className="w-8 h-px bg-gradient-to-l from-white/10 to-transparent" />
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-slate-600/50">
            Study Muse
          </span>
          <div className="w-8 h-px bg-gradient-to-r from-white/10 to-transparent" />
        </div>
      </div>
      
      {/* Background radial glow */}
      <div className="absolute bottom-[-50px] left-1/2 -translate-x-1/2 w-[300px] h-[100px] bg-purple-500/5 blur-[80px] -z-10 rounded-full" />
    </footer>
  );
}

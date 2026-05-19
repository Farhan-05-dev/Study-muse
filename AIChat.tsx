import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Bot, 
  User, 
  Copy, 
  RefreshCw, 
  Mic, 
  Image as ImageIcon,
  Loader2,
  Paperclip,
  X,
  History,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  getDocs, 
  deleteDoc,
  doc,
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '@/lib/firestore';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id: string;
  createdAt?: any;
}

export default function AIChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm your AI Study Assistant. Whether you need help understanding a complex topic, solving a problem, or summarizing notes, I'm here to help. What's on your mind today?", id: 'initial' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'chat_messages'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'asc'),
        limit(50)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const history = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Message[];
        
        if (history.length > 0) {
          setMessages([
            { role: 'assistant', content: "Welcome back! Here's our recent conversation history. How can I assist you further today?", id: 'welcome-back' },
            ...history
          ]);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'chat_messages');
      });

      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !user) return;

    const userInput = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // 1. Save user message to Firestore
      try {
        await addDoc(collection(db, 'chat_messages'), {
          userId: user.uid,
          role: 'user',
          content: userInput,
          createdAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'chat_messages');
      }

      // 2. Call AI API
      const historyForAI = messages
        .filter(m => m.id !== 'initial' && m.id !== 'welcome-back')
        .map(m => ({ role: m.role, content: m.content }));
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...historyForAI, { role: 'user', content: userInput }],
        }),
      });

      if (!response.ok) throw new Error('Failed to get AI response');
      
      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      // 3. Save AI response to Firestore
      try {
        await addDoc(collection(db, 'chat_messages'), {
          userId: user.uid,
          role: 'assistant',
          content: aiResponse,
          createdAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'chat_messages');
      }

    } catch (error) {
      toast.error("Failed to connect to AI server. Please check your Groq API key.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    if (!user) return;
    setIsClearing(true);
    try {
      const q = query(collection(db, 'chat_messages'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const batch = snapshot.docs.map(d => deleteDoc(doc(db, 'chat_messages', d.id)));
      await Promise.all(batch);
      setMessages([{ role: 'assistant', content: "Chat cleared. What's on your mind now?", id: 'cleared' }]);
      toast.success("History cleared.");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'chat_messages');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-5xl mx-auto pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
            <div className="p-2 bg-purple-600/20 rounded-xl border border-purple-500/20">
               <Bot className="w-6 h-6 text-purple-400" />
            </div>
            Study Assistant
          </h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Llama 3.3 70B • Real-time Sync</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="border-slate-800 text-slate-400 hover:bg-red-400/10 hover:text-red-400 rounded-xl" 
          onClick={clearChat}
          disabled={isClearing}
        >
          {isClearing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
          Clear History
        </Button>
      </div>

      <Card className="flex-1 bg-slate-900/40 border-slate-800/80 flex flex-col overflow-hidden backdrop-blur-md shadow-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-transparent pointer-events-none" />
        
        <ScrollArea className="flex-1 p-4 md:p-8 text-slate-100">
          <div className="space-y-8" ref={scrollRef}>
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={cn(
                    "flex gap-4 md:gap-6",
                    message.role === 'user' ? "flex-row-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all",
                    message.role === 'assistant' 
                      ? "bg-purple-600/20 text-purple-400 border-purple-500/20 shadow-lg shadow-purple-500/5" 
                      : "bg-slate-700 text-white border-slate-600 shadow-lg shadow-slate-900/50"
                  )}>
                    {message.role === 'assistant' ? <Bot className="w-6 h-6" /> : <User className="w-6 h-6" />}
                  </div>
                  <div className={cn(
                    "max-w-[85%] md:max-w-[75%] rounded-[1.5rem] p-5 shadow-2xl",
                    message.role === 'user' 
                      ? "bg-purple-600 text-white rounded-tr-none shadow-purple-500/10" 
                      : "bg-slate-800/80 text-slate-200 rounded-tl-none border border-slate-700/50"
                  )}>
                    <div className="prose prose-invert prose-sm max-w-none font-medium leading-relaxed">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && (
              <div className="flex gap-4 md:gap-6">
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
                  <Bot className="w-6 h-6" />
                </div>
                <div className="bg-slate-800/80 rounded-[1.5rem] p-5 rounded-tl-none border border-slate-700/50 shadow-2xl">
                  <div className="flex gap-1.5 py-1">
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-6 border-t border-slate-800 bg-slate-900/60 backdrop-blur-md">
          {messages.length <= 2 && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {[
                { label: "Atomic Structure simply", prompt: "Explain the Atomic Structure in chemistry in simple intuitive terms with a breakdown", icon: "⚛️" },
                { label: "Study Schedule for Finals", prompt: "Create a standard high-efficiency 7-day study schedule for final exams", icon: "📅" },
                { label: "Active Recall strategy", prompt: "Can you detail the best active recall techniques for high density memorization subjects?", icon: "🧠" },
                { label: "Resume Bullet points", prompt: "Summarize 3 highly impactful and actionable bullet points for a CS resume entry", icon: "📝" }
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(item.prompt)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-850 hover:bg-purple-600/10 border border-slate-800 hover:border-purple-500/30 text-xs font-semibold text-slate-300 hover:text-white rounded-full transition-all cursor-pointer shadow-sm"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}

          <div className="relative group">
            <textarea
              className="w-full bg-slate-800/50 border border-slate-700 rounded-[2rem] py-5 pl-6 pr-40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-white resize-none min-h-[72px] max-h-48 custom-scrollbar font-medium placeholder:text-slate-500"
              placeholder="How can I help you study today?"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={1}
            />
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              <Button size="icon" variant="ghost" className="text-slate-500 hover:text-purple-400 h-11 w-11 rounded-full transition-colors">
                <Mic className="w-5 h-5" />
              </Button>
              <Button size="icon" variant="ghost" className="text-slate-500 hover:text-purple-400 h-11 w-11 rounded-full transition-colors">
                <Paperclip className="w-5 h-5" />
              </Button>
              <Button 
                size="icon" 
                className="bg-purple-600 hover:bg-purple-700 text-white h-11 w-11 rounded-2xl shadow-xl shadow-purple-500/20 transition-all active:scale-95" 
                onClick={handleSend} 
                disabled={isLoading || !input.trim()}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </Button>
            </div>
          </div>
          <div className="flex justify-center mt-3">
             <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest flex items-center gap-2">
                <History className="w-3 h-3" />
                History auto-saved
             </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

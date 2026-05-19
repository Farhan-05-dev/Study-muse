import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Search, 
  Send, 
  Upload, 
  Sparkles, 
  BookOpen, 
  Zap, 
  CheckCircle2,
  Brain,
  Layers,
  MessageSquare,
  ChevronRight,
  Loader2,
  FileSearch,
  Quote,
  Flame,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useGamification } from '@/hooks/useGamification';

// Note: In a real production environment, we'd use pdfjs-dist on the client to extract text.
// For this AI Studio preview, we'll focus on the UI/UX and simulated AI interactions.

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function PDFAnalyzer() {
  const { user } = useAuth();
  const { addXP } = useGamification();
  const [file, setFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [summary, setSummary] = useState<any | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/pdf') {
        toast.error("Please upload a PDF file");
        return;
      }
      setFile(selectedFile);
      analyzePDF(selectedFile);
    }
  };

  const analyzePDF = async (file: File) => {
    setIsAnalyzing(true);
    setSummary(null);
    setMessages([]);
    
    // Simulate text extraction
    setExtractedText(`Content of ${file.name}: Quantum mechanics is a fundamental theory in physics that provides a description of the physical properties of nature at the scale of atoms and subatomic particles.`);

    try {
      // In a real app, we'd send the actual text
      const prompt = `Act as an expert academic assistant. Analyze this PDF titled "${file.name}".
      Provide a structured summary in JSON format with:
      - title: string
      - chapters: array of { title: string, summary: string }
      - keyTakeaways: array of strings
      - formulas: array of strings
      - definitions: array of objects { term: string, definition: string }
      
      Simulate analysis based on the title.`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama-3.3-70b-versatile'
        }),
      });

      if (!response.ok) throw new Error('Analysis failed');
      const data = await response.json();
      const content = data.choices[0].message.content;
      
      const jsonStr = content.includes('```json') 
        ? content.split('```json')[1].split('```')[0] 
        : content.includes('```') 
          ? content.split('```')[1].split('```')[0]
          : content;

      const result = JSON.parse(jsonStr);
      setSummary(result);
      
      const welcomeMsg: Message = {
        role: 'assistant',
        content: `I've finished analyzing **${file.name}**. I found ${result.chapters?.length || 0} main topics and ${result.keyTakeaways?.length || 0} key takeaways. What would you like to know about it?`
      };
      setMessages([welcomeMsg]);
      toast.success("PDF analyzed successfully!");
      addXP(100, "Analyzed a PDF document");
    } catch (error) {
      console.error("PDF analysis error:", error);
      toast.error("Failed to analyze PDF.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || !summary || isAnswering) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsAnswering(true);

    try {
      const prompt = `You are an AI learning assistant. I have already analyzed a PDF about "${summary.title}".
      The user is asking: "${input}"
      
      Use the context of the summary I have: ${JSON.stringify(summary)}
      And general academic knowledge to provide a concise, helpful answer that a student would understand. Highlight key terms in bold.`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama-3.3-70b-versatile'
        }),
      });

      if (!response.ok) throw new Error('Failed to get answer');
      const data = await response.json();
      const assistantMsg: Message = {
        role: 'assistant',
        content: data.choices[0].message.content
      };
      setMessages(prev => [...prev, assistantMsg]);
      addXP(10, "Asked a question about PDF");
    } catch (error) {
      console.error("Question error:", error);
      toast.error("Failed to get AI response.");
    } finally {
      setIsAnswering(false);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-6 overflow-hidden">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 px-2">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
            <FileSearch className="w-8 h-8 text-indigo-400" />
            SMART PDF ANALYZER
          </h1>
          <p className="text-slate-500 font-medium text-xs uppercase tracking-widest">Master your documents with AI power</p>
        </div>
        <div className="flex gap-3">
           <input type="file" className="hidden" ref={fileInputRef} accept=".pdf" onChange={handleFileUpload} />
           <Button 
             onClick={() => fileInputRef.current?.click()}
             className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-2 font-bold px-6 shadow-lg shadow-indigo-900/20"
           >
             <Upload className="w-4 h-4" />
             Upload PDF
           </Button>
        </div>
      </div>

      {!file ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
           <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="max-w-md w-full p-12 rounded-[40px] bg-slate-900/40 border border-slate-800 border-dashed flex flex-col items-center text-center gap-6 backdrop-blur-xl"
           >
              <div className="w-24 h-24 rounded-full bg-slate-800/50 flex items-center justify-center">
                 <FileText className="w-12 h-12 text-slate-500" />
              </div>
              <div className="space-y-2">
                 <h3 className="text-2xl font-black text-white uppercase tracking-tight">Drop your notes</h3>
                 <p className="text-slate-500 text-sm">Upload any PDF notes or textbook chapters to start your AI-powered learning journey.</p>
              </div>
              <Button 
                onClick={() => fileInputRef.current?.click()}
                variant="outline" 
                className="rounded-full px-8 border-slate-800 hover:bg-slate-800 text-slate-400"
              >
                Select File
              </Button>
           </motion.div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden relative">
           {/* Summary Section (Left) */}
           <div className="flex-1 overflow-hidden flex flex-col gap-6">
              <ScrollArea className="flex-1 pr-4">
                 <div className="space-y-8 pb-12">
                   {isAnalyzing ? (
                     <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">AI is reading your document...</p>
                     </div>
                   ) : summary && (
                     <>
                        <div className="space-y-2">
                           <h2 className="text-2xl font-black text-white">{summary.title}</h2>
                           <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">{file.name}</Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           <Card className="bg-slate-900/50 border-slate-800 p-4">
                              <h4 className="text-[10px] font-black uppercase text-slate-500 mb-3 tracking-widest flex items-center gap-2">
                                <Layers className="w-3 h-3" /> TopicsFound
                              </h4>
                              <div className="text-2xl font-black text-white">{summary.chapters?.length || 0}</div>
                           </Card>
                           <Card className="bg-slate-900/50 border-slate-800 p-4">
                              <h4 className="text-[10px] font-black uppercase text-slate-500 mb-3 tracking-widest flex items-center gap-2">
                                <Zap className="w-3 h-3 text-yellow-400" /> Definitions
                              </h4>
                              <div className="text-2xl font-black text-white">{summary.definitions?.length || 0}</div>
                           </Card>
                           <Card className="bg-slate-900/50 border-slate-800 p-4">
                              <h4 className="text-[10px] font-black uppercase text-slate-500 mb-3 tracking-widest flex items-center gap-2">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Takeaways
                              </h4>
                              <div className="text-2xl font-black text-white">{summary.keyTakeaways?.length || 0}</div>
                           </Card>
                        </div>

                        <div className="space-y-4">
                           <h3 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-tight">
                              <Sparkles className="w-5 h-5 text-indigo-400" /> TopicSummaries
                           </h3>
                           <div className="space-y-4">
                              {summary.chapters?.map((ch: any, i: number) => (
                                <motion.div 
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: i * 0.1 }}
                                  key={i} 
                                  className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800 group hover:border-indigo-500/30 transition-all"
                                >
                                  <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                                     <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center text-[10px] text-indigo-400">
                                        {i + 1}
                                     </div>
                                     {ch.title}
                                  </h4>
                                  <p className="text-slate-400 text-sm leading-relaxed">{ch.summary}</p>
                                </motion.div>
                              ))}
                           </div>
                        </div>

                        {summary.definitions?.length > 0 && (
                          <div className="space-y-4">
                             <h3 className="text-lg font-bold text-white uppercase tracking-tight">Terminology</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {summary.definitions.map((def: any, i: number) => (
                                  <div key={i} className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                                     <div className="text-indigo-400 font-bold text-xs uppercase mb-1">{def.term}</div>
                                     <p className="text-[11px] text-slate-400 leading-normal">{def.definition}</p>
                                  </div>
                                ))}
                             </div>
                          </div>
                        )}
                        
                        {summary.formulas?.length > 0 && (
                          <div className="space-y-4">
                             <h3 className="text-lg font-bold text-white uppercase tracking-tight">Reference Formulas</h3>
                             <div className="flex flex-wrap gap-2">
                                {summary.formulas.map((formula: string, i: number) => (
                                  <Badge key={i} variant="secondary" className="bg-slate-800 text-slate-100 font-mono py-2 px-4 rounded-xl border border-slate-700">
                                     {formula}
                                  </Badge>
                                ))}
                             </div>
                          </div>
                        )}
                     </>
                   )}
                 </div>
              </ScrollArea>
           </div>

           {/* Chat Section (Right) */}
           <div className="w-full lg:w-[400px] flex flex-col bg-slate-950/50 border border-slate-800 rounded-[32px] overflow-hidden backdrop-blur-xl">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/30">
                 <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-black uppercase tracking-widest text-white">Ask AI Assistant</span>
                 </div>
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              <div className="flex-1 overflow-hidden relative">
                 <ScrollArea className="h-full px-4 pt-4" ref={scrollRef}>
                    <div className="space-y-6 pb-20">
                       {messages.map((m, i) => (
                         <motion.div 
                           initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                           animate={{ opacity: 1, x: 0 }}
                           key={i} 
                           className={cn(
                             "flex flex-col gap-2 max-w-[85%]",
                             m.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                           )}
                         >
                            <div className={cn(
                              "p-4 rounded-2xl text-sm leading-relaxed",
                              m.role === 'user' 
                                ? "bg-indigo-600 text-white rounded-tr-none" 
                                : "bg-slate-800/80 text-slate-200 rounded-tl-none border border-slate-700 shadow-xl"
                            )}>
                               {m.content}
                            </div>
                            <span className="text-[10px] text-slate-600 font-bold uppercase">{m.role}</span>
                         </motion.div>
                       ))}
                       {isAnswering && (
                         <div className="flex gap-2 p-4 bg-slate-800/40 border border-slate-800 rounded-2xl rounded-tl-none mr-auto max-w-[85%]">
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                         </div>
                       )}
                    </div>
                 </ScrollArea>
              </div>

              <div className="p-4 bg-slate-900/50 border-t border-slate-800">
                 <form onSubmit={handleSendMessage} className="relative">
                    <input 
                      type="text" 
                      placeholder="Ask me a question about the PDF..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-xs text-white outline-none focus:ring-2 focus:ring-indigo-500 pr-14"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                    />
                    <Button 
                      type="submit"
                      size="icon" 
                      disabled={!input.trim() || isAnswering || !summary}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 w-10"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                 </form>
                 <div className="mt-3 flex items-center justify-center gap-2">
                    <Zap className="w-3 h-3 text-yellow-500" />
                    <span className="text-[10px] font-black tracking-tighter text-slate-600 uppercase">Powered by LLAMA-3.3-70B</span>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

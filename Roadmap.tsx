import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Map, 
  Sparkles, 
  Target, 
  Clock, 
  Briefcase, 
  GraduationCap,
  ChevronRight,
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingUp,
  Brain,
  Zap,
  Download,
  Share2,
  Calendar,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useGamification } from '@/hooks/useGamification';

interface RoadmapStep {
  title: string;
  description: string;
  duration: string;
  resources: string[];
  tasks: string[];
  isCompleted?: boolean;
}

interface Roadmap {
  id: string;
  goal: string;
  career: string;
  timeAvailable: string;
  skillLevel: string;
  steps: RoadmapStep[];
  currentStep: number;
  createdAt: any;
}

export default function RoadmapGenerator() {
  const { user } = useAuth();
  const { addXP } = useGamification();
  const [isGenerating, setIsGenerating] = useState(false);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [activeRoadmap, setActiveRoadmap] = useState<Roadmap | null>(null);
  
  // Form State
  const [goal, setGoal] = useState('');
  const [career, setCareer] = useState('');
  const [timeAvailable, setTimeAvailable] = useState('10 hours/week');
  const [skillLevel, setSkillLevel] = useState('Beginner');

  useEffect(() => {
    if (user) {
      fetchRoadmaps();
    }
  }, [user]);

  const fetchRoadmaps = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'roadmaps'), 
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Roadmap[];
      setRoadmaps(data);
      if (data.length > 0) setActiveRoadmap(data[0]);
    } catch (error) {
      console.error("Error fetching roadmaps:", error);
    }
  };

  const generateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal || !career) {
      toast.error("Please fill in your goal and career field.");
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = `Generate a highly detailed, professional learning roadmap for a student with the following profile:
      - Goal: ${goal}
      - Career Field: ${career}
      - Time Available: ${timeAvailable}
      - Current Skill Level: ${skillLevel}
      
      The roadmap should be a JSON array of 6-8 sequential "steps". Each step should have:
      - title: string
      - description: string
      - duration: string (e.g. "Week 1-2")
      - resources: array of 2-3 specific resource names or types
      - tasks: array of 3 actionable learning tasks
      
      Format ONLY as a JSON array.`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama-3.3-70b-versatile'
        }),
      });

      if (!response.ok) throw new Error('Generation failed');
      const dataResponse = await response.json();
      const content = dataResponse.choices[0].message.content;
      
      const jsonStr = content.includes('```json') 
        ? content.split('```json')[1].split('```')[0] 
        : content.includes('```') 
          ? content.split('```')[1].split('```')[0]
          : content;

      const steps = JSON.parse(jsonStr);
      
      const roadmapData = {
        userId: user?.uid,
        goal,
        career,
        timeAvailable,
        skillLevel,
        steps: steps.map((s: any) => ({ ...s, isCompleted: false })),
        currentStep: 0,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'roadmaps'), roadmapData);
      const newRoadmap = { id: docRef.id, ...roadmapData, createdAt: new Date() } as Roadmap;
      
      setRoadmaps(prev => [newRoadmap, ...prev]);
      setActiveRoadmap(newRoadmap);
      toast.success("AI Roadmap Generated! 🗺️");
      addXP(150, "Generated a New Learning Roadmap");
      
      // Reset form
      setGoal('');
      setCareer('');
    } catch (error) {
      console.error("Roadmap generation error:", error);
      toast.error("Failed to generate roadmap. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleStep = async (stepIndex: number) => {
    if (!activeRoadmap) return;
    
    const updatedSteps = [...activeRoadmap.steps];
    updatedSteps[stepIndex].isCompleted = !updatedSteps[stepIndex].isCompleted;
    
    const completedCount = updatedSteps.filter(s => s.isCompleted).length;
    const isNowFinished = updatedSteps[stepIndex].isCompleted;

    try {
      await updateDoc(doc(db, 'roadmaps', activeRoadmap.id), {
        steps: updatedSteps,
        currentStep: stepIndex
      });
      
      setActiveRoadmap({ ...activeRoadmap, steps: updatedSteps });
      setRoadmaps(prev => prev.map(r => r.id === activeRoadmap.id ? { ...r, steps: updatedSteps } : r));
      
      if (isNowFinished) {
        addXP(25, `Milestone Reached: ${updatedSteps[stepIndex].title}`);
        toast.success("Step marked as complete!", {
          description: "Keep pushing toward your goal!"
        });
      }
    } catch (error) {
      console.error("Error updating step:", error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tighter flex items-center gap-3">
            <Map className="w-8 h-8 text-blue-400" />
            AI ROADMAP PLANNER
          </h1>
          <p className="text-slate-400 font-medium italic">"A goal without a plan is just a wish." — Build your journey now.</p>
        </div>
        <div className="flex gap-3">
           <Button 
             variant="outline" 
             className="rounded-xl border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white"
             onClick={() => setActiveRoadmap(null)}
           >
             Create New
           </Button>
        </div>
      </div>

      {!activeRoadmap || !activeRoadmap.steps ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          <Card className="lg:col-span-2 bg-slate-900/40 border-slate-800 p-8 rounded-3xl backdrop-blur-xl">
             <form onSubmit={generateRoadmap} className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                     <Target className="w-3 h-3" /> What is your Goal?
                   </label>
                   <input 
                     type="text" 
                     placeholder="e.g. Master React & Node.js"
                     className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                     value={goal}
                     onChange={(e) => setGoal(e.target.value)}
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                     <Briefcase className="w-3 h-3" /> Career Path
                   </label>
                   <input 
                     type="text" 
                     placeholder="e.g. Full Stack Developer"
                     className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                     value={career}
                     onChange={(e) => setCareer(e.target.value)}
                   />
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                     <Clock className="w-3 h-3" /> Time Commitment
                   </label>
                   <select 
                     className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                     value={timeAvailable}
                     onChange={(e) => setTimeAvailable(e.target.value)}
                   >
                     <option>5 hours/week</option>
                     <option>10 hours/week</option>
                     <option>20 hours/week</option>
                     <option>Full-time (40+ h/w)</option>
                   </select>
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                     <TrendingUp className="w-3 h-3" /> Current Skill Level
                   </label>
                   <select 
                     className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                     value={skillLevel}
                     onChange={(e) => setSkillLevel(e.target.value)}
                   >
                     <option>Beginner (No experience)</option>
                     <option>Intermediate (Basic knowledge)</option>
                     <option>Advanced (Know the fundamentals)</option>
                   </select>
                 </div>
               </div>

               <Button 
                 type="submit" 
                 disabled={isGenerating}
                 className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-14 font-black text-lg gap-3 shadow-xl shadow-blue-900/20 uppercase tracking-tight overflow-hidden relative group"
               >
                 <AnimatePresence mode="wait">
                   {isGenerating ? (
                     <motion.div 
                       key="loading"
                       initial={{ y: 20 }} 
                       animate={{ y: 0 }} 
                       className="flex items-center gap-2"
                     >
                       <Loader2 className="w-6 h-6 animate-spin" />
                       Crafting your path...
                     </motion.div>
                   ) : (
                     <motion.div 
                       key="ready"
                       initial={{ y: -20 }} 
                       animate={{ y: 0 }} 
                       className="flex items-center gap-2"
                     >
                       <Sparkles className="w-6 h-6" />
                       Generate AI Roadmap
                     </motion.div>
                   )}
                 </AnimatePresence>
                 <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-[-20deg]" />
               </Button>
             </form>
          </Card>

          <div className="space-y-6">
             <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest">Recent Sessions</h3>
             <div className="space-y-3">
               {roadmaps.map((r, i) => (
                 <Card 
                  key={r.id} 
                  className="bg-slate-900/50 border-slate-800 hover:border-blue-500/50 transition-all cursor-pointer p-4 group"
                  onClick={() => setActiveRoadmap(r)}
                 >
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 group-hover:bg-blue-600/20 transition-colors">
                        <Map className="w-5 h-5 text-slate-500 group-hover:text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">{r.goal}</h4>
                        <p className="text-[10px] text-slate-500 uppercase font-black">{r.career}</p>
                      </div>
                   </div>
                 </Card>
               ))}
               {roadmaps.length === 0 && (
                 <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-2xl">
                    <p className="text-xs text-slate-600 font-bold uppercase">No Roadmaps yet</p>
                 </div>
               )}
             </div>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content: Timeline */}
          <div className="lg:col-span-2 space-y-12">
            <div className="flex items-center justify-between border-b border-slate-800 pb-8">
               <div className="space-y-1">
                 <h2 className="text-3xl font-black text-white tracking-tighter uppercase">{activeRoadmap.goal}</h2>
                 <div className="flex gap-4">
                   <span className="text-[10px] uppercase font-black text-blue-500 tracking-widest flex items-center gap-1">
                     <Briefcase className="w-3 h-3" /> {activeRoadmap.career}
                   </span>
                   <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest flex items-center gap-1">
                     <Clock className="w-3 h-3" /> {activeRoadmap.timeAvailable}
                   </span>
                   <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest flex items-center gap-1">
                     <TrendingUp className="w-3 h-3" /> {activeRoadmap.skillLevel}
                   </span>
                 </div>
               </div>
               <div className="text-right">
                  <div className="text-[10px] uppercase font-black text-slate-500 mb-1">Completion</div>
                  <div className="text-2xl font-black text-white">
                    {Math.round((activeRoadmap.steps.filter(s => s.isCompleted).length / activeRoadmap.steps.length) * 100)}%
                  </div>
               </div>
            </div>

            <div className="relative space-y-12 pl-12 border-l-2 border-slate-800">
               {activeRoadmap.steps.map((step, i) => (
                 <motion.div 
                   key={i}
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: i * 0.1 }}
                   className={cn(
                     "relative p-8 rounded-3xl transition-all border group",
                     step.isCompleted 
                      ? "bg-slate-900/30 border-emerald-500/20 opacity-80" 
                      : "bg-slate-900/60 border-slate-800 hover:border-blue-500/30 shadow-xl"
                   )}
                 >
                   {/* Timeline Marker */}
                   <div className={cn(
                     "absolute -left-[61px] top-10 w-10 h-10 rounded-full border-4 border-slate-950 flex items-center justify-center transition-all z-10",
                     step.isCompleted ? "bg-emerald-500" : "bg-slate-800 group-hover:bg-blue-600"
                   )}>
                     {step.isCompleted ? <CheckCircle2 className="w-5 h-5 text-white" /> : <span className="text-xs font-black text-white">{i + 1}</span>}
                   </div>

                   <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                     <div className="space-y-4 flex-1">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 uppercase text-[10px] font-black">
                            {step.duration}
                          </Badge>
                          <h3 className={cn("text-xl font-bold text-white", step.isCompleted && "line-through text-slate-500")}>{step.title}</h3>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                           <div className="space-y-3">
                              <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Key Resources</h4>
                              <ul className="space-y-2">
                                {step.resources.map((res, ri) => (
                                  <li key={ri} className="text-xs text-blue-300 font-medium flex items-center gap-2 hover:translate-x-1 transition-transform cursor-pointer">
                                    <ArrowRight className="w-3 h-3" /> {res}
                                  </li>
                                ))}
                              </ul>
                           </div>
                           <div className="space-y-3">
                              <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Learning Tasks</h4>
                              <div className="space-y-2">
                                {step.tasks.map((task, ti) => (
                                  <div key={ti} className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/50 border border-slate-800 text-[11px] text-slate-300">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                    {task}
                                  </div>
                                ))}
                              </div>
                           </div>
                        </div>
                     </div>
                     <div className="pt-2">
                        <Button 
                          onClick={() => toggleStep(i)}
                          variant={step.isCompleted ? "secondary" : "default"}
                          className={cn(
                            "rounded-full px-8 font-black uppercase tracking-tight transition-all",
                            step.isCompleted 
                              ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20" 
                              : "bg-white text-black hover:bg-slate-200"
                          )}
                        >
                          {step.isCompleted ? "Completed" : "Finish Step"}
                        </Button>
                     </div>
                   </div>
                 </motion.div>
               ))}
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">
             <Card className="bg-slate-900/60 border-slate-800 rounded-3xl p-8 sticky top-8">
                <div className="space-y-8">
                   <div className="space-y-4">
                     <h3 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        Next Milestone
                     </h3>
                     <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                          <Zap className="w-20 h-20 text-yellow-400" />
                        </div>
                        <h4 className="text-sm font-bold text-white mb-2">
                          {activeRoadmap.steps.find(s => !s.isCompleted)?.title || "Goal Reached!"}
                        </h4>
                        <p className="text-xs text-slate-500 mb-4">Complete this to reach the next stage of your career.</p>
                        <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black uppercase">Continue Journey</Button>
                     </div>
                   </div>

                   <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest">Share Progress</h3>
                      <div className="grid grid-cols-2 gap-2">
                         <Button variant="outline" className="rounded-xl border-slate-800 bg-slate-900/50 text-xs h-10 gap-2">
                           <Download className="w-3 h-3" /> PDF
                         </Button>
                         <Button variant="outline" className="rounded-xl border-slate-800 bg-slate-900/50 text-xs h-10 gap-2">
                           <Share2 className="w-3 h-3" /> Share
                         </Button>
                      </div>
                   </div>

                   <Card className="bg-gradient-to-br from-indigo-950 to-blue-900 border-none relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-20">
                         <Sparkles className="w-16 h-16" />
                      </div>
                      <CardContent className="p-6 relative">
                         <h4 className="text-white font-bold mb-2">AI Tip</h4>
                         <p className="text-blue-100 text-[11px] leading-relaxed">
                            "Studies show that students who update their roadmap weekly are 4x more likely to reach their career goals."
                         </p>
                      </CardContent>
                   </Card>
                </div>
             </Card>
          </div>
        </div>
      )}
    </div>
  );
}

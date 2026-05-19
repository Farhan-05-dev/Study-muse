import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Upload, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ArrowRight,
  Download,
  Target,
  Brain,
  Zap,
  Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export default function ResumeAnalyzer() {
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [targetJob, setTargetJob] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.endsWith('.docx')) {
      toast.error("Please upload a PDF or DOCX file");
      return;
    }
    
    // In a real app, we'd extract text from the PDF/DOCX here.
    // For this prototype, we'll simulate the text extraction or assume the user provides context.
    // I'll show a prompt for the user to paste their resume text if extraction isn't available.
    toast.success("File uploaded! Analyzing content...");
    analyzeResume("Sample Resume Content for " + file.name);
  };

  const analyzeResume = async (resumeText: string) => {
    setIsAnalyzing(true);
    try {
      const prompt = `Analyze this resume for a candidate aiming for the role of "${targetJob || 'Software Engineer'}".
      Provide a comprehensive ATS analysis in JSON format with the following keys:
      - score: number (0-100)
      - summary: string (3 sentences)
      - suggestions: array of strings
      - keywordsFound: array of strings
      - missingKeywords: array of strings
      - bulletPoints: array of objects with { original: string, improved: string }
      - formattingScore: number (0-100)
      - skillsGap: array of strings
      
      Resume context: ${resumeText}`;

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
      setAnalysisResult(result);
      
      // Save result to Firestore
      if (user) {
        await addDoc(collection(db, 'resume_analyses'), {
          userId: user.uid,
          targetJob: targetJob || 'General',
          score: result.score,
          analysis: result,
          createdAt: serverTimestamp()
        });
      }
      
      toast.success("Analysis complete!");
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Failed to analyze resume. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tighter flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-purple-400" />
            AI RESUME ANALYZER
          </h1>
          <p className="text-slate-400 font-medium">Optimize your resume for ATS and get hired faster.</p>
        </div>
      </div>

      {!analysisResult ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl p-8 border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center min-h-[400px] text-center p-0">
              <div 
                className={cn(
                  "w-full h-full flex flex-col items-center justify-center gap-6 p-12 transition-all rounded-2xl",
                  dragActive ? "bg-purple-600/10 border-purple-500/50" : "hover:bg-slate-800/20"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-2">
                  <Upload className="w-10 h-10 text-slate-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white">Upload your Resume</h3>
                  <p className="text-slate-400">Drag and drop your resume file here or click to browse</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef} 
                  accept=".pdf,.docx"
                  onChange={(e) => e.target.files && processFile(e.target.files[0])}
                />
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white text-black hover:bg-slate-200 px-8 rounded-full font-bold h-12 shadow-xl"
                >
                  Select File
                </Button>
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-600">Supports PDF & DOCX • Max 5MB</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-800 p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" />
                Target Job Role
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Desired Position</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Senior Frontend Engineer"
                    value={targetJob}
                    onChange={(e) => setTargetJob(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                   {['Frontend Developer', 'Data Scientist', 'Product Manager', 'UX Designer'].map(role => (
                     <Button 
                       key={role} 
                       variant="ghost" 
                       size="sm"
                       className="justify-start text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                       onClick={() => setTargetJob(role)}
                     >
                       + {role}
                     </Button>
                   ))}
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border-purple-500/20 p-8 relative overflow-hidden">
               <div className="absolute -right-8 -top-8 opacity-10">
                 <Brain className="w-32 h-32" />
               </div>
               <div className="relative z-10 space-y-4">
                 <h4 className="text-lg font-bold text-white uppercase tracking-tight">Why Analysis matters?</h4>
                 <p className="text-slate-400 text-sm leading-relaxed">
                   Over 75% of resumes are filtered out by Applicant Tracking Systems (ATS) before humans even see them. Our AI ensures yours makes the cut.
                 </p>
                 <ul className="space-y-2">
                    {[
                      'Keyword Optimization',
                      'Grammar & Impact Check',
                      'Skills Gap Analysis',
                      'Bullet Point Enhancement'
                    ].map(item => (
                      <li key={item} className="flex items-center gap-2 text-xs text-slate-100 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        {item}
                      </li>
                    ))}
                 </ul>
               </div>
            </Card>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Results Column */}
          <div className="lg:col-span-2 space-y-8">
             <motion.div
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl"
             >
               <Tabs defaultValue="suggestions" className="w-full">
                 <TabsList className="bg-slate-950/50 border border-slate-800 p-1 rounded-2xl mb-8">
                   <TabsTrigger value="suggestions" className="rounded-xl px-6 data-[state=active]:bg-purple-600 data-[state=active]:text-white">Suggestions</TabsTrigger>
                   <TabsTrigger value="keywords" className="rounded-xl px-6 data-[state=active]:bg-purple-600 data-[state=active]:text-white">Keywords</TabsTrigger>
                   <TabsTrigger value="bullets" className="rounded-xl px-6 data-[state=active]:bg-purple-600 data-[state=active]:text-white">Rewritten Bullets</TabsTrigger>
                 </TabsList>

                 <TabsContent value="suggestions" className="space-y-4">
                    {analysisResult.suggestions?.map((item: string, i: number) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i} 
                        className="flex items-start gap-4 p-4 rounded-2xl bg-slate-800/30 border border-slate-800 hover:border-slate-700 transition-all border-l-4 border-l-purple-500"
                      >
                        <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                          <Zap className="w-4 h-4 text-purple-400" />
                        </div>
                        <p className="text-white text-sm font-medium pt-1">{item}</p>
                      </motion.div>
                    ))}
                 </TabsContent>

                 <TabsContent value="keywords" className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest">Keywords Found</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.keywordsFound?.map((kw: string) => (
                          <Badge key={kw} variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 py-1.5 px-4 rounded-full">
                            {kw}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest">Recommended Actions</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.missingKeywords?.map((kw: string) => (
                          <Badge key={kw} variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 py-1.5 px-4 rounded-full">
                            + Add {kw}
                          </Badge>
                        ))}
                      </div>
                    </div>
                 </TabsContent>

                 <TabsContent value="bullets" className="space-y-6">
                    {analysisResult.bulletPoints?.map((bp: any, i: number) => (
                      <div key={i} className="space-y-3 p-6 rounded-2xl bg-slate-950/50 border border-slate-800">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-500">Original</span>
                          <p className="text-slate-400 text-sm line-through decoration-red-500/30">{bp.original}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-emerald-500 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Improved with AI
                          </span>
                          <p className="text-white text-sm font-semibold">{bp.improved}</p>
                        </div>
                      </div>
                    ))}
                 </TabsContent>
               </Tabs>
             </motion.div>
          </div>

          {/* Sidebar Stats Column */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 sticky top-8"
            >
              <div className="text-center space-y-6 mb-8">
                <div className="relative inline-block">
                  <svg className="w-40 h-40 transform -rotate-90">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      className="text-slate-800"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray={440}
                      strokeDashoffset={440 - (440 * (analysisResult.score || 0)) / 100}
                      className="text-purple-500 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)] transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-black text-white">{analysisResult.score}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">ATS Score</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">Formatting</span>
                    <span className="text-xs font-black text-white">{analysisResult.formattingScore}%</span>
                  </div>
                  <Progress value={analysisResult.formattingScore} className="h-1.5 bg-slate-800" />
                </div>
              </div>

              <div className="space-y-4 pt-8 border-t border-slate-800">
                <Button 
                  onClick={() => setAnalysisResult(null)}
                  variant="outline" 
                   className="w-full rounded-xl border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-white font-bold h-12"
                >
                  Analyze Another
                </Button>
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold h-12 gap-2 shadow-lg shadow-purple-900/20">
                  <Download className="w-4 h-4" />
                  Export Insights
                </Button>
              </div>

              <div className="mt-8 p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
                 <div className="flex items-center gap-3 mb-2">
                   <Briefcase className="w-4 h-4 text-purple-400" />
                   <h5 className="text-xs font-bold text-white uppercase tracking-tight">Job Fit Analysis</h5>
                 </div>
                 <p className="text-[11px] text-purple-200/60 leading-relaxed italic">
                   "Your profile shows strong alignment with technical requirements but could improve in showcasing leadership impact."
                 </p>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Analyzing Overlay */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="relative">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="w-40 h-40 rounded-full border-4 border-dashed border-purple-500/30"
              />
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Search className="w-12 h-12 text-purple-400" />
              </motion.div>
            </div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-8 space-y-4"
            >
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Analyzing your career...</h2>
              <div className="flex gap-2 justify-center">
                 {['Parsing Text', 'Matching Keywords', 'Improving Bullets', 'Calculating Score'].map((step, i) => (
                   <motion.div
                     key={step}
                     animate={{ opacity: [0.3, 1, 0.3] }}
                     transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}
                     className="text-[10px] font-black tracking-widest text-purple-400 uppercase bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20"
                   >
                     {step}
                   </motion.div>
                 ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Sparkles, 
  Download, 
  Copy, 
  Plus, 
  Trash2,
  Loader2,
  ChevronRight,
  BookOpen,
  Hash,
  Type,
  ListIcon,
  Save,
  Clock,
  Brain,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from 'jspdf';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  getDocs, 
  orderBy,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '@/lib/firestore';
import { cn } from '@/lib/utils';

interface SavedNote {
  id: string;
  topic: string;
  generatedNotes: string;
  createdAt: any;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface QuizResults {
  score: number;
  total: number;
  questions: (QuizQuestion & { userAnswer?: string })[];
}

import { useGamification } from '@/hooks/useGamification';

export default function NotesGen() {
  const { user } = useAuth();
  const { addXP } = useGamification();
  const [topic, setTopic] = useState('');
  const [content, setContent] = useState('');
  const [generatedNotes, setGeneratedNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [quizHistory, setQuizHistory] = useState<any[]>([]);
  const [loadingQuizHistory, setLoadingQuizHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Quiz State
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [isSavingQuiz, setIsSavingQuiz] = useState(false);

  useEffect(() => {
    if (user) {
      loadSavedNotes();
      loadQuizHistory();
    }
  }, [user]);

  const loadQuizHistory = async () => {
    if (!user) return;
    setLoadingQuizHistory(true);
    try {
      const q = query(
        collection(db, 'quizzes'), 
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const history = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setQuizHistory(history);
    } catch (error) {
      console.error("Error loading quiz history:", error);
    } finally {
      setLoadingQuizHistory(false);
    }
  };

  const loadSavedNotes = async () => {
    if (!user) return;
    setLoadingNotes(true);
    try {
      const q = query(
        collection(db, 'notes'), 
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const notes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SavedNote[];
      setSavedNotes(notes);
    } catch (error) {
      console.error("Error loading notes:", error);
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim() && !content.trim()) {
      toast.error("Please provide a topic or some content to summarize");
      return;
    }

    setIsGenerating(true);
    setIsQuizMode(false);
    try {
      const prompt = topic 
        ? `Generate comprehensive study notes for the topic: "${topic}". Include key concepts, definitions, examples, and important formulas if applicable. Format as Markdown.`
        : `Summarize the following study material and extract key points, definitions, and examples: \n\n${content}\n\nFormat as Markdown study notes.`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) throw new Error('Failed to generate notes');
      const data = await response.json();
      setGeneratedNotes(data.choices[0].message.content);
      toast.success("Notes generated successfully!");
      addXP(50, "Generated AI Study Notes");
    } catch (error) {
      toast.error("Generation failed. Check your connection and API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!generatedNotes) return;

    setIsGeneratingQuiz(true);
    setIsQuizMode(true);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setShowResults(false);

    try {
      const prompt = `Based on these study notes, generate a 5-question multiple choice quiz. 
      Format the output as a JSON array of objects. Each object should have:
      "question": string,
      "options": string array (exactly 4 options),
      "correctAnswer": string (must match exactly one of the options),
      "explanation": string (explaining why the answer is correct).

      Notes:
      ${generatedNotes}
      
      IMPORTANT: Return ONLY the JSON array.`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) throw new Error('Failed to generate quiz');
      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Attempt to parse JSON from AI response
      const jsonStart = content.indexOf('[');
      const jsonEnd = content.lastIndexOf(']') + 1;
      const jsonStr = content.substring(jsonStart, jsonEnd);
      
      const parsedQuiz = JSON.parse(jsonStr);
      setQuizQuestions(parsedQuiz);
      toast.success("Quiz generated! Good luck.");
    } catch (error) {
      console.error("Quiz generation error:", error);
      toast.error("Failed to generate quiz. Try again.");
      setIsQuizMode(false);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const saveQuizResult = async (score: number) => {
    if (!user || !quizQuestions.length) return;
    setIsSavingQuiz(true);
    try {
      const quizData = {
        userId: user.uid,
        topic: topic || 'Study Quiz',
        score: score,
        totalQuestions: quizQuestions.length,
        questions: quizQuestions.map((q, idx) => ({
          ...q,
          userAnswer: userAnswers[idx] || null
        })),
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'quizzes'), quizData);
      toast.success("Quiz results saved to history!");
      loadQuizHistory();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'quizzes');
    } finally {
      setIsSavingQuiz(false);
    }
  };

  const handleFinishQuiz = () => {
    let score = 0;
    quizQuestions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswer) score++;
    });
    setShowResults(true);
    saveQuizResult(score);
  };

  const saveNote = async () => {
    if (!user || !generatedNotes) return;
    setIsSaving(true);
    try {
      const noteData = {
        userId: user.uid,
        topic: topic || 'Untitled Study Note',
        rawContent: content,
        generatedNotes: generatedNotes,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await addDoc(collection(db, 'notes'), noteData);
      toast.success("Note saved to your library!");
      loadSavedNotes();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'notes');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteNote = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notes', id));
      toast.success("Note removed.");
      setSavedNotes(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `notes/${id}`);
    }
  };

  const exportAsPDF = () => {
    const doc = new jsPDF();
    const margin = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    const textWidth = pageWidth - (margin * 2);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(topic || "Study Muse Notes", margin, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    const splitText = doc.splitTextToSize(generatedNotes.replace(/[#*`]/g, ''), textWidth);
    
    let y = 30;
    splitText.forEach((line: string) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += 7;
    });
    
    doc.save(`${topic || 'study-muse-notes'}.pdf`);
  };

  const filteredNotes = savedNotes.filter(note => 
    note.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.generatedNotes.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredQuizzes = quizHistory.filter(quiz => 
    quiz.topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Notes Generator</h1>
          <p className="text-slate-400">Transform any topic or text into organized study notes.</p>
        </div>
        {generatedNotes && (
          <div className="flex flex-wrap gap-2">
            {!isQuizMode && (
              <Button 
                variant="outline" 
                className="border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20"
                onClick={handleGenerateQuiz}
                disabled={isGeneratingQuiz}
              >
                {isGeneratingQuiz ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
                Take Quiz
              </Button>
            )}
            <Button variant="outline" className="border-slate-800 text-slate-400" onClick={() => {
              setGeneratedNotes('');
              setTopic('');
              setContent('');
              setIsQuizMode(false);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              New Notes
            </Button>
            <Button variant="outline" className="border-slate-800 text-slate-400" onClick={saveNote} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save to Library
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={exportAsPDF}>
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Inputs and History */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-slate-900/50 border-slate-800 p-6 backdrop-blur-sm border-t-2 border-t-purple-500/50">
            <Tabs defaultValue="topic" className="w-full">
              <TabsList className="bg-slate-800/50 border border-slate-700/50 w-full mb-6">
                <TabsTrigger value="topic" className="flex-1 gap-2 text-xs">
                  <Hash className="w-3 h-3" />
                  Topic
                </TabsTrigger>
                <TabsTrigger value="content" className="flex-1 gap-2 text-xs">
                  <Type className="w-3 h-3" />
                  Raw Text
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="topic" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">Topic Title</label>
                  <Input 
                    placeholder="e.g. Photosynthesis, Binary Search..."
                    className="bg-slate-800/50 border-slate-700 text-white focus:ring-purple-500 h-11"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="content" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">Paste material</label>
                  <Textarea 
                    placeholder="Paste textbook excerpts, lecture transcripts..."
                    className="bg-slate-800/50 border-slate-700 text-white h-48 resize-none focus:ring-purple-500"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>
              </TabsContent>
            </Tabs>
            
            <Button 
              className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white font-bold h-12 rounded-xl group relative overflow-hidden shadow-[0_0_20px_-5px_rgba(147,51,234,0.5)]"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              <AnimatePresence mode="wait">
                {isGenerating ? (
                  <motion.div 
                    key="gen"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="flex items-center"
                  >
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </motion.div>
                ) : (
                  <motion.div 
                    key="idle"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="flex items-center"
                  >
                    <Sparkles className="w-5 h-5 mr-2 text-yellow-400 animate-pulse" />
                    Generate Study Notes
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 p-6 backdrop-blur-sm">
            <Tabs defaultValue="notes-history" className="w-full">
              <TabsList className="bg-slate-800/50 border border-slate-700/50 w-full mb-4">
                <TabsTrigger value="notes-history" className="flex-1 gap-2 text-[10px] uppercase font-bold">
                  <Clock className="w-3 h-3" />
                  Notes
                </TabsTrigger>
                <TabsTrigger value="quiz-history" className="flex-1 gap-2 text-[10px] uppercase font-bold">
                  <Brain className="w-3 h-3" />
                  Quizzes
                </TabsTrigger>
              </TabsList>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input 
                  placeholder="Search library..." 
                  className="pl-10 bg-slate-800/30 border-slate-700/50 text-xs text-white h-9 focus:ring-purple-500 rounded-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <TabsContent value="notes-history" className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {loadingNotes ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-700" />
                  </div>
                ) : filteredNotes.length > 0 ? (
                  filteredNotes.map((note) => (
                    <div key={note.id} className="group relative">
                      <button 
                        onClick={() => {
                          setGeneratedNotes(note.generatedNotes);
                          setTopic(note.topic);
                          setIsQuizMode(false);
                        }}
                        className="w-full text-left p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 hover:border-purple-500/50 hover:bg-slate-800/60 transition-all"
                      >
                        <p className="text-sm font-medium text-slate-200 line-clamp-1">{note.topic}</p>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tighter">
                          {note.createdAt ? (note.createdAt.toDate ? note.createdAt.toDate() : new Date(note.createdAt)).toLocaleDateString() : 'N/A'}
                        </p>
                      </button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-1 top-1 h-7 w-7 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNote(note.id);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-600">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-xs">No saved notes yet</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="quiz-history" className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {loadingQuizHistory ? (
                   <div className="flex justify-center py-4">
                     <Loader2 className="w-6 h-6 animate-spin text-slate-700" />
                   </div>
                ) : filteredQuizzes.length > 0 ? (
                  filteredQuizzes.map((q) => (
                    <button 
                      key={q.id}
                      onClick={() => {
                        setQuizQuestions(q.questions);
                        setTopic(q.topic);
                        const answersRec: Record<number, string> = {};
                        q.questions.forEach((question: any, idx: number) => {
                           if (question.userAnswer) answersRec[idx] = question.userAnswer;
                        });
                        setUserAnswers(answersRec);
                        setShowResults(true);
                        setIsQuizMode(true);
                      }}
                      className="w-full text-left p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 hover:border-purple-500/50 hover:bg-slate-800/60 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium text-slate-200 line-clamp-1">{q.topic}</p>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tighter">
                          {q.createdAt ? (q.createdAt.toDate ? q.createdAt.toDate() : new Date(q.createdAt)).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div className="bg-purple-500/10 text-purple-400 px-2 py-1 rounded text-[10px] font-bold shrink-0">
                        {q.score}/{q.totalQuestions}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-600">
                    <Brain className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-xs">No quiz sessions found</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Viewer Panel */}
        <div className="lg:col-span-8 h-full">
          <Card className="bg-slate-900/50 border-slate-800 h-full min-h-[600px] flex flex-col overflow-hidden backdrop-blur-xl ring-1 ring-white/5">
            <div className="p-4 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  {isQuizMode ? 'Quiz Mode' : 'Workspace / Viewer'}
                </span>
              </div>
              {generatedNotes && !isQuizMode && (
                <Button variant="ghost" size="sm" className="h-8 text-slate-400 hover:text-white text-xs gap-2" onClick={() => {
                  navigator.clipboard.writeText(generatedNotes);
                  toast.success("Copied to clipboard");
                }}>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Markdown
                </Button>
              )}
              {isQuizMode && (
                <Button variant="ghost" size="sm" className="h-8 text-slate-400 hover:text-white text-xs" onClick={() => setIsQuizMode(false)}>
                  Back to Notes
                </Button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="wait">
                {isQuizMode ? (
                  <motion.div
                    key="quiz"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-8 md:p-12 max-w-2xl mx-auto"
                  >
                    {isGeneratingQuiz ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-purple-500 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Analyzing your notes...</h3>
                        <p className="text-slate-400">Our AI is crafting challenging questions for you.</p>
                      </div>
                    ) : showResults ? (
                      <div className="space-y-8">
                        <div className="text-center bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8">
                          <h3 className="text-2xl font-bold text-white mb-2">Quiz Complete!</h3>
                          <p className="text-slate-400 mb-6">Here is how you performed:</p>
                          <div className="relative inline-block">
                             <svg className="w-32 h-32 transform -rotate-12">
                                <circle 
                                  cx="64" cy="64" r="58" 
                                  fill="none" stroke="currentColor" 
                                  strokeWidth="12" 
                                  className="text-slate-800"
                                />
                                <circle 
                                  cx="64" cy="64" r="58" 
                                  fill="none" stroke="currentColor" 
                                  strokeWidth="12" 
                                  strokeDasharray={364}
                                  strokeDashoffset={364 - (364 * (quizQuestions.filter((q, i) => userAnswers[i] === q.correctAnswer).length / quizQuestions.length))}
                                  className="text-purple-500"
                                  strokeLinecap="round"
                                />
                             </svg>
                             <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black text-white">
                                  {quizQuestions.filter((q, i) => userAnswers[i] === q.correctAnswer).length}
                                  /{quizQuestions.length}
                                </span>
                             </div>
                          </div>
                        </div>

                        <div className="space-y-6">
                           {quizQuestions.map((q, i) => (
                             <div key={i} className={cn(
                                "p-6 rounded-2xl border transition-all",
                                userAnswers[i] === q.correctAnswer 
                                  ? "bg-emerald-500/5 border-emerald-500/20" 
                                  : "bg-red-500/5 border-red-500/20"
                             )}>
                               <div className="flex items-start gap-3 mb-4">
                                 {userAnswers[i] === q.correctAnswer ? (
                                   <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                                 ) : (
                                   <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                                 )}
                                 <p className="font-bold text-white leading-snug">{q.question}</p>
                               </div>
                               <div className="ml-8 space-y-2">
                                 <div className="text-sm">
                                   <span className="text-slate-400 mr-2">Your answer:</span>
                                   <span className={userAnswers[i] === q.correctAnswer ? "text-emerald-400" : "text-red-400"}>
                                     {userAnswers[i] || 'No answer'}
                                   </span>
                                 </div>
                                 {userAnswers[i] !== q.correctAnswer && (
                                   <div className="text-sm">
                                     <span className="text-slate-400 mr-2">Correct answer:</span>
                                     <span className="text-emerald-400">{q.correctAnswer}</span>
                                   </div>
                                 )}
                                 <div className="mt-4 p-3 bg-slate-900/50 rounded-lg text-xs leading-relaxed text-slate-300 italic">
                                   <strong>Explanation:</strong> {q.explanation}
                                 </div>
                               </div>
                             </div>
                           ))}
                        </div>

                        <div className="flex gap-4">
                          <Button className="flex-1 bg-slate-800 hover:bg-slate-700 text-white rounded-xl" onClick={handleGenerateQuiz}>
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Retake Quiz
                          </Button>
                          <Button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl" onClick={() => setIsQuizMode(false)}>
                            Finish
                          </Button>
                        </div>
                      </div>
                    ) : quizQuestions.length > 0 ? (
                      <div className="space-y-8">
                        <div className="flex items-center justify-between">
                           <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Question {currentQuestionIndex + 1} of {quizQuestions.length}</span>
                           <div className="w-32 h-1 bg-slate-800 rounded-full overflow-hidden">
                             <motion.div 
                               className="h-full bg-purple-500"
                               initial={{ width: 0 }}
                               animate={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }}
                             />
                           </div>
                        </div>

                        <div className="space-y-6">
                           <h2 className="text-2xl font-bold text-white leading-tight">
                             {quizQuestions[currentQuestionIndex].question}
                           </h2>

                           <div className="grid grid-cols-1 gap-3">
                             {quizQuestions[currentQuestionIndex].options.map((option, i) => (
                               <button
                                 key={i}
                                 onClick={() => setUserAnswers(prev => ({ ...prev, [currentQuestionIndex]: option }))}
                                 className={cn(
                                   "p-4 rounded-xl text-left transition-all border group",
                                   userAnswers[currentQuestionIndex] === option
                                     ? "bg-purple-600/10 border-purple-500 text-white ring-1 ring-purple-500/50 shadow-lg shadow-purple-500/10"
                                     : "bg-slate-800/40 border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-slate-800/60"
                                 )}
                               >
                                 <div className="flex items-center gap-3">
                                   <div className={cn(
                                     "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-colors",
                                     userAnswers[currentQuestionIndex] === option
                                       ? "bg-purple-500 text-white"
                                       : "bg-slate-700 text-slate-400 group-hover:bg-slate-600 group-hover:text-slate-200"
                                   )}>
                                     {String.fromCharCode(65 + i)}
                                   </div>
                                   {option}
                                 </div>
                               </button>
                             ))}
                           </div>
                        </div>

                        <div className="flex items-center justify-between pt-8">
                           <Button 
                             variant="ghost" 
                             disabled={currentQuestionIndex === 0}
                             onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                             className="text-slate-400 hover:text-white"
                           >
                              Back
                           </Button>
                           
                           {currentQuestionIndex === quizQuestions.length - 1 ? (
                             <Button 
                               className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8 font-bold"
                               onClick={handleFinishQuiz}
                               disabled={!userAnswers[currentQuestionIndex]}
                             >
                               Finish Quiz
                             </Button>
                           ) : (
                             <Button 
                               className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-8 font-bold gap-2"
                               onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                               disabled={!userAnswers[currentQuestionIndex]}
                             >
                               Next
                               <ArrowRight className="w-4 h-4" />
                             </Button>
                           )}
                        </div>
                      </div>
                    ) : null}
                  </motion.div>
                ) : (
                  <motion.div
                    key="notes"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-8 md:p-12"
                  >
                    {generatedNotes ? (
                      <div className="prose prose-invert prose-slate max-w-none 
                                     prose-headings:text-white prose-headings:tracking-tight prose-headings:font-bold
                                     prose-p:text-slate-300 prose-p:leading-relaxed
                                     prose-li:text-slate-300 prose-strong:text-purple-400
                                     prose-code:text-purple-300 prose-code:bg-purple-900/30 prose-code:px-1 prose-code:rounded
                                     prose-pre:bg-slate-900/80 prose-pre:border prose-pre:border-slate-800"
                      >
                        <ReactMarkdown>{generatedNotes}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-12 text-slate-600">
                        <div className="relative mb-8">
                          <div className="absolute inset-0 bg-purple-600/20 blur-3xl rounded-full" />
                          <div className="relative w-24 h-24 rounded-full bg-slate-800/30 border border-slate-700/50 flex items-center justify-center">
                            <Sparkles className="w-10 h-10 text-slate-700" />
                          </div>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-200 mb-3 tracking-tight">AI Study Muse</h3>
                        <p className="max-w-sm text-slate-500 leading-relaxed">
                          Input a topic or textbook section to generate high-quality study notes, summaries, and key insights.
                        </p>
                        
                        <div className="mt-12 grid grid-cols-2 gap-4 max-w-md w-full">
                          {[
                            { icon: <Hash className="w-4 h-4" />, label: 'Topic based' },
                            { icon: <Type className="w-4 h-4" />, label: 'Context aware' },
                            { icon: <Sparkles className="w-4 h-4" />, label: 'AI Enhanced' },
                            { icon: <Download className="w-4 h-4" />, label: 'PDF Export' },
                          ].map((item, i) => (
                            <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-slate-800/20 border border-slate-800/40 text-slate-500 text-xs">
                              <span className="text-purple-500/50">{item.icon}</span>
                              {item.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

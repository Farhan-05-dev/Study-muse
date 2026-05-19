import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Brain, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  History,
  Trophy,
  Loader2,
  Sparkles,
  Timer as TimerIcon,
  HelpCircle,
  Play,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
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
  limit
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '@/lib/firestore';

interface Question {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

interface QuizRecord {
  id: string;
  topic: string;
  score: number;
  totalQuestions: number;
  createdAt: any;
}

export default function QuizGen() {
  const { user } = useAuth();
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [history, setHistory] = useState<QuizRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const q = query(
        collection(db, 'quizzes'), 
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const snapshot = await getDocs(q);
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as QuizRecord[];
      setHistory(records);
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Enter a topic for the quiz!");
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = `Generate a 5-question multiple choice quiz for the topic: "${topic}". Format as a JSON array of objects with "question", "options" (array of 4 strings), "answer" (one of the options), and "explanation". Provide ONLY the JSON.`;
      
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
      
      const jsonStr = content.includes('```json') 
        ? content.split('```json')[1].split('```')[0] 
        : content.includes('```') 
          ? content.split('```')[1].split('```')[0]
          : content;

      setQuestions(JSON.parse(jsonStr));
      setCurrentIndex(0);
      setScore(0);
      setShowResults(false);
      setSelectedOption(null);
      setIsAnswered(false);
      toast.success("Quiz is ready! Good luck.");
    } catch (error) {
      toast.error("Failed to generate quiz. Try another topic.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinish = async () => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'quizzes'), {
        userId: user.uid,
        topic: topic,
        score: score,
        totalQuestions: questions.length,
        questions: questions,
        createdAt: serverTimestamp()
      });
      loadHistory();
    } catch (error) {
      console.error("Error saving quiz result:", error);
    }
  };

  const handleOptionSelect = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
  };

  const handleSubmit = () => {
    if (!selectedOption) return;
    setIsAnswered(true);
    if (selectedOption === questions[currentIndex].answer) {
      setScore(score + 1);
      toast.success("Correct!", { duration: 1500 });
    } else {
      toast.error("Incorrect", { duration: 1500 });
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResults(true);
      handleFinish();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Quiz Generator</h1>
          <p className="text-slate-400">Test your knowledge with AI-driven dynamic quizzes.</p>
        </div>
        {questions.length > 0 && !showResults && (
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                 <TimerIcon className="w-4 h-4" />
                 <span>Question {currentIndex + 1} of {questions.length}</span>
              </div>
              <Progress value={((currentIndex + 1) / questions.length) * 100} className="w-32 h-2" />
           </div>
        )}
      </div>

      {!questions.length || showResults ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <motion.div
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             className="lg:col-span-8"
          >
            <Card className="bg-slate-900/50 border-slate-800 p-8 text-center backdrop-blur-md h-full flex flex-col justify-center shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
              {showResults ? (
                <div className="space-y-8 py-6">
                  <div className="w-24 h-24 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-500/20 ring-4 ring-yellow-500/5">
                    <Trophy className="w-12 h-12 text-yellow-500" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-black text-white mb-2 tracking-tight">Quiz Finished!</h2>
                    <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-4 tabular-nums">
                      {Math.round((score / questions.length) * 100)}%
                    </div>
                    <p className="text-slate-400 text-lg font-medium">You got {score} correct out of {questions.length} questions.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                    <Button variant="outline" size="lg" className="h-14 rounded-2xl border-slate-700 text-white gap-2 transition-transform hober:scale-105" onClick={() => setQuestions([])}>
                      <Plus className="w-5 h-5" /> New Quiz
                    </Button>
                    <Button size="lg" className="h-14 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white px-10 gap-2 shadow-lg shadow-purple-500/20 transition-transform hover:scale-105" onClick={() => {
                      setCurrentIndex(0);
                      setShowResults(false);
                      setScore(0);
                      setIsAnswered(false);
                      setSelectedOption(null);
                    }}>
                      <History className="w-5 h-5" /> Practice Again
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="max-w-md mx-auto space-y-10 py-10">
                  <div className="w-24 h-24 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto ring-4 ring-purple-500/10 relative">
                    <Brain className="w-12 h-12 text-purple-400" />
                    <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full -z-10" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-white tracking-tight">Challenge Yourself</h2>
                    <p className="text-slate-400 text-balance">Enter any topic and Study Muse will generate a unique challenge just for you.</p>
                  </div>
                  <div className="space-y-4">
                    <Input 
                      placeholder="e.g. Quantum Mechanics, SEO Basics..." 
                      className="h-14 bg-slate-800/50 border-slate-700 text-lg text-white rounded-2xl text-center focus:ring-purple-500"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                    />
                    <Button 
                      className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-white text-lg font-black rounded-2xl shadow-xl shadow-purple-500/20 transition-all hover:scale-[1.02]"
                      disabled={isGenerating}
                      onClick={handleGenerate}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                          Creating Quiz...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-6 h-6 mr-2 text-yellow-400" />
                          GENERATE QUIZ
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>

          <div className="lg:col-span-4 space-y-6">
             <Card className="bg-slate-900/50 border-slate-800 p-6 backdrop-blur-sm shadow-xl">
                <h3 className="text-white font-bold mb-6 flex items-center gap-2 uppercase tracking-widest text-xs">
                  <History className="w-4 h-4 text-purple-400" />
                  Recent Scores
                </h3>
                <div className="space-y-4">
                  {loadingHistory ? (
                    <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-slate-700" /></div>
                  ) : history.length > 0 ? (
                    history.map(record => (
                      <div key={record.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-purple-500/30 transition-all">
                        <div className={cn(
                          "w-12 h-12 rounded-lg flex items-center justify-center font-black text-sm tabular-nums",
                          (record.score / record.totalQuestions) >= 0.8 ? "bg-emerald-500/10 text-emerald-400" : "bg-purple-500/10 text-purple-400"
                        )}>
                          {Math.round((record.score / record.totalQuestions) * 100)}%
                        </div>
                        <div className="overflow-hidden">
                           <p className="text-sm font-bold text-white truncate">{record.topic}</p>
                           <p className="text-[10px] text-slate-500 uppercase font-black tracking-tight">{record.score}/{record.totalQuestions} Correct</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
                       <p className="text-xs text-slate-600 font-bold uppercase">No history yet</p>
                    </div>
                  )}
                </div>
                <Button variant="link" className="w-full text-purple-400 text-xs font-bold mt-4 uppercase">View Full History</Button>
             </Card>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="bg-slate-900/50 border-slate-800 overflow-hidden shadow-2xl ring-1 ring-white/5">
              <div className="p-1.5 bg-gradient-to-r from-purple-600 via-blue-500 to-emerald-500" />
              <CardContent className="p-8 md:p-12">
                <div className="flex items-start gap-4 mb-10">
                  <div className="w-12 h-12 rounded-2xl bg-purple-600/20 flex items-center justify-center shrink-0 border border-purple-500/20 ring-4 ring-purple-500/5">
                     <HelpCircle className="w-7 h-7 text-purple-400" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tight">
                    {questions[currentIndex].question}
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {questions[currentIndex].options.map((option, idx) => {
                    const isSelected = selectedOption === option;
                    const isCorrect = isAnswered && option === questions[currentIndex].answer;
                    const isWrong = isAnswered && isSelected && option !== questions[currentIndex].answer;

                    return (
                      <button
                        key={idx}
                        className={cn(
                          "w-full p-6 rounded-[1.5rem] text-left transition-all flex items-center justify-between border group relative overflow-hidden",
                          isSelected 
                            ? "border-purple-500 bg-purple-500/10 ring-1 ring-purple-500/20" 
                            : "border-slate-800 bg-slate-900/50 hover:bg-slate-800/80 hover:border-slate-700",
                          isCorrect && "border-emerald-500 bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
                          isWrong && "border-red-500 bg-red-500/10 text-red-400 ring-1 ring-red-500/20"
                        )}
                        onClick={() => handleOptionSelect(option)}
                        disabled={isAnswered}
                      >
                        <div className="flex items-center gap-6 relative z-10">
                           <div className={cn(
                             "w-10 h-10 rounded-xl flex items-center justify-center border font-black text-sm transition-all",
                             isSelected ? "bg-purple-600 border-purple-500 text-white scale-110 shadow-lg shadow-purple-500/20" : "border-slate-700 text-slate-500 group-hover:border-slate-600"
                           )}>
                              {String.fromCharCode(65 + idx)}
                           </div>
                           <span className="font-bold text-lg">{option}</span>
                        </div>
                        {isCorrect && <CheckCircle2 className="w-7 h-7 text-emerald-500 relative z-10" />}
                        {isWrong && <XCircle className="w-7 h-7 text-red-500 relative z-10" />}
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {isAnswered && (
                    <motion.div
                       initial={{ opacity: 0, scale: 0.98, y: 10 }}
                       animate={{ opacity: 1, scale: 1, y: 0 }}
                       className="mt-10 p-8 bg-slate-900/60 rounded-[2rem] border border-slate-700/50 relative overflow-hidden shadow-2xl"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-3">Explanation</h4>
                      <p className="text-slate-200 leading-relaxed font-medium">
                        {questions[currentIndex].explanation}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
              <CardFooter className="p-8 bg-slate-900/30 border-t border-slate-800 flex justify-end">
                 {!isAnswered ? (
                    <Button 
                      className="bg-purple-600 hover:bg-purple-700 text-white h-14 px-12 rounded-2xl font-black text-lg shadow-xl shadow-purple-500/20 transition-all hover:scale-105 active:scale-95"
                      disabled={!selectedOption}
                      onClick={handleSubmit}
                    >
                      SUBMIT ANSWER
                    </Button>
                 ) : (
                    <Button 
                      className="bg-slate-50 text-slate-900 hover:bg-white h-14 px-12 rounded-2xl font-black text-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                      onClick={nextQuestion}
                    >
                      {currentIndex < questions.length - 1 ? "Next Question" : "View Results"}
                      <ChevronRight className="w-6 h-6" />
                    </Button>
                 )}
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}

import { cn } from '@/lib/utils';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { 
  Plus, 
  RotateCw, 
  Brain, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X,
  Sparkles,
  Loader2,
  Trophy,
  History,
  Play,
  Trash2,
  Library,
  PlusCircle,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Layers,
  Edit3,
  FileQuestion,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Timer as TimerIcon,
  HelpCircle,
  GripVertical
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
  writeBatch,
  orderBy
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '@/lib/firestore';
import { cn } from '@/lib/utils';
import { useGamification } from '@/hooks/useGamification';

// Perspective and 3D classes moved to a style tag at the bottom for reliability
  const PerspectiveStyles = () => (
    <style dangerouslySetInnerHTML={{ __html: `
      .perspective-1000 {
        perspective: 1000px;
      }
      .preserve-3d {
        transform-style: preserve-3d;
      }
      .backface-hidden {
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
      }
      .rotate-y-180 {
        transform: rotateY(180deg);
      }
      .card-flip-container {
        transition: transform 0.6s;
        transform-style: preserve-3d;
      }
      .card-flip-container.flipped {
        transform: rotateY(180deg);
      }
    `}} />
  );

interface Flashcard {
  id: string;
  front: string;
  back: string;
  createdAt: any;
}

interface FlashcardDeck {
  id: string;
  topic: string;
  userId: string;
  cardCount: number;
  createdAt: any;
}

interface Question {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

// Interactive Flashcard Item for the library preview
function FlashcardItem({ card, onDelete }: { card: Flashcard; onDelete: () => void }) {
  const [localFlipped, setLocalFlipped] = useState(false);

  return (
    <div 
      className="cursor-pointer group/card relative h-40"
      onClick={() => setLocalFlipped(!localFlipped)}
    >
      <motion.div
        className="w-full h-full relative preserve-3d"
        animate={{ rotateY: localFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
      >
        <div className="absolute inset-0 backface-hidden bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col shadow-xl overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Front Side</span>
            <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
               <GripVertical className="w-4 h-4 text-slate-700 cursor-grab active:cursor-grabbing" onClick={(e) => e.stopPropagation()} />
               <Button 
                variant="ghost" size="icon" 
                className="h-7 w-7 text-slate-700 hover:text-red-400"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          <p className="text-slate-100 font-bold leading-snug line-clamp-4 text-sm">{card.front}</p>
        </div>
        
        <div className="absolute inset-0 backface-hidden bg-purple-600/10 border border-purple-500/20 rounded-3xl p-6 flex flex-col rotate-y-180 backdrop-blur-sm shadow-xl overflow-hidden">
          <span className="text-[9px] font-black uppercase tracking-widest text-purple-400 mb-4">Back Side</span>
          <p className="text-slate-300 text-sm leading-relaxed line-clamp-4">{card.back}</p>
        </div>
      </motion.div>
    </div>
  );
}

export default function Flashcards() {
  const { user } = useAuth();
  const { addXP } = useGamification();
  const [topic, setTopic] = useState('');
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [loadingDecks, setLoadingDecks] = useState(false);
  
  // Active View State
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  
  // Interaction State
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  
  // Manual Entry State
  const [newCardFront, setNewCardFront] = useState('');
  const [newCardBack, setNewCardBack] = useState('');
  const [isSavingCard, setIsSavingCard] = useState(false);
  const frontInputRef = React.useRef<HTMLInputElement>(null);
  
  // Study session state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  // Quiz State
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedQuizOption, setSelectedQuizOption] = useState<string | null>(null);
  const [isQuizAnswered, setIsQuizAnswered] = useState(false);
  const [showQuizResults, setShowQuizResults] = useState(false);

  // Keyboard Shortcuts for Study Mode
  useEffect(() => {
    if (!isStudyMode || showResults) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid shortcuts if user is typing in an input (though unlikely in study mode)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          setIsFlipped(prev => !prev);
          break;
        case 'ArrowRight':
        case 'Enter':
        case '1':
          e.preventDefault();
          handleScore(true);
          break;
        case 'ArrowLeft':
        case 'Escape':
        case '2':
          e.preventDefault();
          handleScore(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStudyMode, showResults, currentIndex, isFlipped]);

  useEffect(() => {
    if (user) {
      loadDecks();
    }
  }, [user]);

  const loadDecks = async () => {
    if (!user) return;
    setLoadingDecks(true);
    try {
      const q = query(
        collection(db, 'flashcard_decks'), 
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const decksFound = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FlashcardDeck[];
      setDecks(decksFound);
    } catch (error) {
      console.error("Error loading decks:", error);
    } finally {
      setLoadingDecks(false);
    }
  };

  const loadDeckCards = async (deck: FlashcardDeck) => {
    setLoadingCards(true);
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, `flashcard_decks/${deck.id}/cards`),
          orderBy('createdAt', 'asc')
        )
      );
      const deckCards = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Flashcard[];
      
      setActiveDeck(deck);
      setCards(deckCards);
      setIsStudyMode(false);
      setShowResults(false);
      setIsAddingCard(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `flashcard_decks/${deck.id}/cards`);
    } finally {
      setLoadingCards(false);
    }
  };

  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !topic.trim()) return;

    setIsCreatingDeck(true);
    try {
      const deckRef = await addDoc(collection(db, 'flashcard_decks'), {
        userId: user.uid,
        topic: topic.trim(),
        cardCount: 0,
        createdAt: serverTimestamp()
      });
      
      const newDeck = {
        id: deckRef.id,
        userId: user.uid,
        topic: topic.trim(),
        cardCount: 0,
        createdAt: new Date()
      } as FlashcardDeck;
      
      setDecks(prev => [newDeck, ...prev]);
      setActiveDeck(newDeck);
      setCards([]);
      setTopic('');
      toast.success("Deck created!");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'flashcard_decks');
    } finally {
      setIsCreatingDeck(false);
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Enter a topic first!");
      return;
    }

    if (!user) {
      toast.error("Please sign in to generate decks.");
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = `Generate 10 educational flashcards for the topic: "${topic}". Format as a JSON array of objects with "front" and "back" properties (strings). Provide ONLY the JSON array.`;
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) throw new Error('Failed to generate cards');
      const data = await response.json();
      const content = data.choices[0].message.content;
      
      const jsonStr = content.includes('```json') 
        ? content.split('```json')[1].split('```')[0] 
        : content.includes('```') 
          ? content.split('```')[1].split('```')[0]
          : content;

      const parsedCards = JSON.parse(jsonStr);

      // Create Deck
      const deckRef = await addDoc(collection(db, 'flashcard_decks'), {
        userId: user.uid,
        topic: topic,
        cardCount: parsedCards.length,
        createdAt: serverTimestamp()
      });

      // Save Cards in batch
      const batch = writeBatch(db);
      const cardsToSet: Flashcard[] = [];
      
      parsedCards.forEach((card: any) => {
        const cardRef = doc(collection(db, `flashcard_decks/${deckRef.id}/cards`));
        const cardData = {
          front: card.front,
          back: card.back,
          createdAt: serverTimestamp()
        };
        batch.set(cardRef, cardData);
        cardsToSet.push({ id: cardRef.id, ...cardData });
      });
      
      await batch.commit();

      const newDeck = {
        id: deckRef.id,
        userId: user.uid,
        topic: topic,
        cardCount: parsedCards.length,
        createdAt: new Date()
      } as FlashcardDeck;

      setDecks(prev => [newDeck, ...prev]);
      setActiveDeck(newDeck);
      setCards(cardsToSet);
      setTopic('');
      toast.success("AI Deck generated and saved!");
    } catch (error) {
      toast.error("Failed to generate and save cards.");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDeck || !newCardFront.trim() || !newCardBack.trim() || isSavingCard) return;

    setIsSavingCard(true);
    try {
      const cardData = {
        front: newCardFront.trim(),
        back: newCardBack.trim(),
        createdAt: serverTimestamp()
      };
      const cardRef = await addDoc(collection(db, `flashcard_decks/${activeDeck.id}/cards`), cardData);
      
      setCards(prev => [...prev, { id: cardRef.id, ...cardData }]);
      setNewCardFront('');
      setNewCardBack('');
      // We no longer close the form automatically to allow multiple additions
      // setIsAddingCard(false); 
      
      toast.success("Card added!");
      
      // Focus the front input for the next card
      frontInputRef.current?.focus();
      
      // Update deck count locally
      setDecks(prev => prev.map(d => d.id === activeDeck.id ? { ...d, cardCount: d.cardCount + 1 } : d));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `flashcard_decks/${activeDeck.id}/cards`);
    } finally {
      setIsSavingCard(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!activeDeck) return;
    try {
      await deleteDoc(doc(db, `flashcard_decks/${activeDeck.id}/cards`, cardId));
      setCards(prev => prev.filter(c => c.id !== cardId));
      toast.success("Card deleted");
      setDecks(prev => prev.map(d => d.id === activeDeck.id ? { ...d, cardCount: d.cardCount - 1 } : d));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `flashcard_decks/${activeDeck.id}/cards/${cardId}`);
    }
  };

  const deleteDeck = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Delete this deck and all its contents?")) return;
    
    try {
      await deleteDoc(doc(db, 'flashcard_decks', id));
      toast.success("Deck deleted.");
      setDecks(prev => prev.filter(d => d.id !== id));
      if (activeDeck?.id === id) {
        setActiveDeck(null);
        setCards([]);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `flashcard_decks/${id}`);
    }
  };

  const handleScore = (success: boolean) => {
    if (success) setScore(score + 1);
    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(currentIndex + 1), 150);
    } else {
      setShowResults(true);
      // Award XP for finishing a study session
      addXP(50 + (score * 5), "Study Session Complete");
    }
  };

  const startStudy = () => {
    if (cards.length === 0) {
      toast.error("Add some cards first!");
      return;
    }
    setIsStudyMode(true);
    setIsQuizMode(false);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowResults(false);
    setScore(0);
  };

  const handleGenerateQuiz = async () => {
    if (!activeDeck || cards.length < 3) {
      toast.error("Deck needs at least 3 cards for a quiz!");
      return;
    }

    setIsGeneratingQuiz(true);
    try {
      const deckContext = cards.map(c => `Front: ${c.front}, Back: ${c.back}`).join('\n');
      const prompt = `Generate a high-quality 5-question multiple choice quiz based on these flashcards about ${activeDeck.topic}:
      ${deckContext}
      
      Format instructions:
      1. Return ONLY a JSON array of objects.
      2. Each object must have: "question" (string), "options" (array of 4 unique strings), "answer" (string matching one of the options), and "explanation" (string).
      3. Ensure options are challenging and relevant.
      
      Example format:
      [{"question": "...", "options": ["...", "...", "...", "..."], "answer": "...", "explanation": "..."}]`;
      
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

      const parsedQuestions = JSON.parse(jsonStr);
      setQuizQuestions(parsedQuestions);
      setIsQuizMode(true);
      setIsStudyMode(false);
      setCurrentQuizIndex(0);
      setQuizScore(0);
      setSelectedQuizOption(null);
      setIsQuizAnswered(false);
      setShowQuizResults(false);
      toast.success("Quiz generated from deck!");
    } catch (error) {
      toast.error("Failed to generate quiz from cards.");
      console.error(error);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleQuizSubmit = () => {
    if (!selectedQuizOption) return;
    setIsQuizAnswered(true);
    if (selectedQuizOption === quizQuestions[currentQuizIndex].answer) {
      setQuizScore(quizScore + 1);
      toast.success("Correct!", { duration: 1500 });
    } else {
      toast.error("Incorrect", { duration: 1500 });
    }
  };

  const nextQuizQuestion = () => {
    if (currentQuizIndex < quizQuestions.length - 1) {
      setCurrentQuizIndex(currentQuizIndex + 1);
      setSelectedQuizOption(null);
      setIsQuizAnswered(false);
    } else {
      setShowQuizResults(true);
      // Award XP for finishing a quiz
      addXP(100 + (quizScore * 20), "Quiz Mastered");
      saveQuizResult();
    }
  };

  const saveQuizResult = async () => {
    if (!user || !activeDeck) return;
    try {
      await addDoc(collection(db, 'quizzes'), {
        userId: user.uid,
        topic: `${activeDeck.topic} (Flashcard Quiz)`,
        score: quizScore,
        totalQuestions: quizQuestions.length,
        questions: quizQuestions,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error saving quiz result:", error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-in fade-in duration-700">
      <PerspectiveStyles />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Flashcards</h1>
          <p className="text-slate-400">Master hard concepts through active recall and AI assistance.</p>
        </div>
        
        {!isStudyMode && (
          <div className="flex flex-wrap gap-4 items-end">
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Deck Topic</label>
                <div className="flex gap-2">
                   <Input 
                     placeholder="e.g. World Capitals" 
                     className="w-64 bg-slate-900/50 border-slate-800 text-white rounded-xl focus:ring-purple-500"
                     value={topic}
                     onChange={(e) => setTopic(e.target.value)}
                   />
                   <Button 
                     onClick={handleCreateDeck}
                     disabled={!topic.trim() || isCreatingDeck}
                     variant="outline"
                     className="rounded-xl border-slate-800 bg-slate-900 text-slate-300 hover:text-white"
                   >
                     {isCreatingDeck ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4 mr-2" />}
                     Manual
                   </Button>
                </div>
             </div>
             <Button 
               className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg shadow-purple-500/20 px-8 h-12 font-bold"
               disabled={isGenerating || !topic.trim()}
               onClick={handleGenerate}
             >
               {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
               AI Generate
             </Button>
          </div>
        )}
      </div>

      {isStudyMode && activeDeck ? (
        <div className="space-y-12 py-10 flex flex-col items-center animate-in zoom-in-95 duration-300">
          <div className="w-full flex items-center justify-between max-w-2xl px-4">
             <Button variant="ghost" onClick={() => setIsStudyMode(false)} className="text-slate-400 hover:text-white">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Exit MasterMode
             </Button>
             <div className="bg-slate-900/50 px-4 py-1.5 rounded-full border border-slate-800 text-xs font-bold text-slate-400">
               {currentIndex + 1} / {cards.length}
             </div>
          </div>

          {showResults ? (
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="text-center space-y-8"
            >
               <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto ring-1 ring-emerald-500/30">
                  <Trophy className="w-12 h-12 text-emerald-400" />
               </div>
               <div>
                  <h2 className="text-4xl font-bold text-white mb-2">Well Done!</h2>
                  <p className="text-slate-400 text-lg">You mastered {score} out of {cards.length} cards in {activeDeck.topic}.</p>
               </div>
               <div className="flex gap-4 justify-center">
                  <Button variant="outline" size="lg" className="h-14 rounded-2xl border-slate-700 text-white" onClick={() => setIsStudyMode(false)}>
                    Back to Library
                  </Button>
                  <Button size="lg" className="h-14 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white px-10" onClick={startStudy}>
                    <RotateCw className="w-5 h-5 mr-2" />
                    Restart
                  </Button>
               </div>
            </motion.div>
          ) : (
            <>
              {/* Flashcard Component */}
              <div 
                className="w-full max-w-2xl aspect-[1.6/1] cursor-pointer perspective-1000 group"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <motion.div
                  className="w-full h-full relative preserve-3d"
                  initial={false}
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                >
                  <div className="absolute inset-0 backface-hidden bg-slate-900 border-2 border-slate-800 rounded-[2.5rem] p-12 flex items-center justify-center shadow-2xl text-center ring-1 ring-white/5 overflow-y-auto">
                    <div>
                       <span className="text-[10px] uppercase tracking-[0.3em] text-slate-600 font-black mb-6 block">Question</span>
                       <p className="text-2xl md:text-4xl font-bold text-white select-none leading-tight tracking-tight">
                         {cards[currentIndex].front}
                       </p>
                    </div>
                  </div>
                  
                  <div className="absolute inset-0 backface-hidden bg-purple-900/10 border-2 border-purple-500/20 rounded-[2.5rem] p-12 flex items-center justify-center shadow-2xl text-center rotate-y-180 backdrop-blur-md ring-1 ring-purple-500/20 overflow-y-auto">
                    <div>
                       <span className="text-[10px] uppercase tracking-[0.3em] text-purple-400 font-black mb-6 block">Correct Answer</span>
                       <p className="text-xl md:text-3xl font-medium text-slate-100 select-none leading-relaxed">
                         {cards[currentIndex].back}
                       </p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-8">
                <Button 
                  variant="outline" 
                  className="w-20 h-20 rounded-3xl border-slate-800 bg-slate-900/50 text-red-400 hover:bg-red-400/10 hover:border-red-400/30 group/btn transition-all"
                  onClick={(e) => { e.stopPropagation(); handleScore(false); }}
                >
                  <X className="w-10 h-10 transition-transform group-hover/btn:scale-110" />
                </Button>
                
                <div className="flex flex-col items-center">
                  <div className="flex gap-2">
                    <Button 
                       variant="ghost" size="icon" 
                       onClick={(e) => { e.stopPropagation(); setIsFlipped(false); setTimeout(() => setCurrentIndex(Math.max(0, currentIndex - 1)), 150); }}
                       disabled={currentIndex === 0}
                       className="text-slate-500 hover:text-white"
                    >
                      <ArrowLeft className="w-6 h-6" />
                    </Button>
                    <Button 
                       variant="ghost" size="icon" 
                       onClick={(e) => { e.stopPropagation(); setIsFlipped(false); setTimeout(() => setCurrentIndex(Math.min(cards.length - 1, currentIndex + 1)), 150); }}
                       disabled={currentIndex === cards.length - 1}
                       className="text-slate-500 hover:text-white"
                    >
                      <ArrowRight className="w-6 h-6" />
                    </Button>
                  </div>
                  <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest mt-4">Click to Flip</p>
                </div>

                <Button 
                  variant="outline" 
                  className="w-20 h-20 rounded-3xl border-slate-800 bg-slate-900/50 text-emerald-400 hover:bg-emerald-400/10 hover:border-emerald-400/30 group/btn transition-all"
                  onClick={(e) => { e.stopPropagation(); handleScore(true); }}
                >
                  <Check className="w-10 h-10 transition-transform group-hover/btn:scale-110" />
                </Button>
              </div>

              {/* Keyboard Hints */}
              <div className="flex gap-6 text-[10px] uppercase font-black tracking-widest text-slate-600 mt-4">
                 <span className="flex items-center gap-1.5"><code className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-slate-400">SPACE</code> Flip</span>
                 <span className="flex items-center gap-1.5"><code className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-emerald-500/50">1</code> Known</span>
                 <span className="flex items-center gap-1.5"><code className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-red-500/50">2</code> Unknown</span>
              </div>
            </>
          )}
        </div>
      ) : isQuizMode && activeDeck ? (
        <div className="max-w-4xl mx-auto space-y-8 py-10 animate-in zoom-in-95 duration-300">
           <div className="flex items-center justify-between mb-8">
              <Button variant="ghost" onClick={() => setIsQuizMode(false)} className="text-slate-400 hover:text-white">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Exit Quiz
              </Button>
              {!showQuizResults && (
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                       <TimerIcon className="w-4 h-4" />
                       <span>{currentQuizIndex + 1} / {quizQuestions.length}</span>
                    </div>
                    <Progress value={((currentQuizIndex + 1) / quizQuestions.length) * 100} className="w-32 h-2" />
                </div>
              )}
           </div>

           {showQuizResults ? (
             <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-10 py-10"
             >
                <div className="text-center space-y-6">
                  <div className="w-24 h-24 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto ring-4 ring-yellow-500/5">
                    <Trophy className="w-12 h-12 text-yellow-500" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-black text-white mb-2">Quiz Results</h2>
                    <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-4">
                        {Math.round((quizScore / quizQuestions.length) * 100)}%
                    </div>
                    <p className="text-slate-400 text-lg">You got {quizScore} correct out of {quizQuestions.length} questions.</p>
                  </div>
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                   {quizQuestions.map((q, idx) => (
                      <div key={idx} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                         <div className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0 mt-1">{idx + 1}</span>
                            <p className="text-white font-bold">{q.question}</p>
                         </div>
                         <div className="pl-9 space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                               <Check className="w-4 h-4 text-emerald-500" />
                               <span className="text-emerald-400 font-medium">{q.answer}</span>
                            </div>
                            <p className="text-xs text-slate-500 italic leading-relaxed">{q.explanation}</p>
                         </div>
                      </div>
                   ))}
                </div>

                <div className="flex gap-4 justify-center">
                   <Button variant="outline" size="lg" className="h-14 rounded-2xl border-slate-700 text-white" onClick={() => setIsQuizMode(false)}>
                      Back to Deck
                   </Button>
                   <Button size="lg" className="h-14 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white px-10" onClick={handleGenerateQuiz}>
                      <RotateCw className="w-5 h-5 mr-2" />
                      Try New Quiz
                   </Button>
                </div>
             </motion.div>
           ) : (
             <motion.div
               key={currentQuizIndex}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
             >
                <Card className="bg-slate-900 border-slate-800 overflow-hidden shadow-2xl">
                    <div className="p-10 md:p-14">
                        <div className="flex items-start gap-4 mb-10">
                            <div className="w-12 h-12 bg-purple-600/20 rounded-2xl flex items-center justify-center shrink-0 border border-purple-500/20">
                                <HelpCircle className="w-7 h-7 text-purple-400" />
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                                {quizQuestions[currentQuizIndex].question}
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {quizQuestions[currentQuizIndex].options.map((option, idx) => {
                                const isSelected = selectedQuizOption === option;
                                const isCorrect = isQuizAnswered && option === quizQuestions[currentQuizIndex].answer;
                                const isWrong = isQuizAnswered && isSelected && option !== quizQuestions[currentQuizIndex].answer;

                                return (
                                    <button
                                        key={idx}
                                        disabled={isQuizAnswered}
                                        onClick={() => setSelectedQuizOption(option)}
                                        className={cn(
                                            "w-full p-6 bg-slate-800/20 border border-slate-800 rounded-3xl text-left transition-all flex items-center justify-between group",
                                            isSelected && "border-purple-500 bg-purple-500/5",
                                            isCorrect && "border-emerald-500 bg-emerald-500/10 text-emerald-400",
                                            isWrong && "border-red-500 bg-red-500/10 text-red-400"
                                        )}
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center border border-slate-700 font-bold text-sm",
                                                isSelected && "bg-purple-600 border-purple-500 text-white"
                                            )}>
                                                {String.fromCharCode(65 + idx)}
                                            </div>
                                            <span className="font-bold text-lg">{option}</span>
                                        </div>
                                        {isCorrect && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
                                        {isWrong && <XCircle className="w-6 h-6 text-red-500" />}
                                    </button>
                                );
                            })}
                        </div>

                        <AnimatePresence>
                            {isQuizAnswered && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mt-10 p-6 bg-slate-800/30 rounded-3xl border border-slate-700/50"
                                >
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Explanation</h4>
                                    <p className="text-slate-300 font-medium">
                                        {quizQuestions[currentQuizIndex].explanation}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <CardFooter className="p-8 bg-slate-900/50 border-t border-slate-800 flex justify-end">
                        {!isQuizAnswered ? (
                            <Button 
                                className="h-14 px-12 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold"
                                disabled={!selectedQuizOption}
                                onClick={handleQuizSubmit}
                            >
                                Submit Answer
                            </Button>
                        ) : (
                            <Button 
                                className="h-14 px-12 bg-white text-black hover:bg-slate-200 rounded-2xl font-bold flex items-center gap-2"
                                onClick={nextQuizQuestion}
                            >
                                {currentQuizIndex < quizQuestions.length - 1 ? "Next Question" : "Finish Quiz"}
                                <ChevronRight className="w-5 h-5" />
                            </Button>
                        )}
                    </CardFooter>
                </Card>
             </motion.div>
           )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full min-h-[600px]">
          {/* Library Sidebar */}
          <div className="lg:col-span-4 space-y-6">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <Library className="w-5 h-5 text-purple-400" />
                  Your Decks
                </h3>
             </div>
             
             <Card className="bg-slate-900/30 border-slate-800 max-h-[700px] overflow-hidden flex flex-col">
                <Reorder.Group 
                  axis="y" 
                  values={decks} 
                  onReorder={setDecks}
                  className="p-2 space-y-1 overflow-y-auto custom-scrollbar"
                >
                  {loadingDecks ? (
                    Array(4).fill(0).map((_, i) => (
                       <div key={i} className="h-20 bg-slate-800/20 rounded-xl animate-pulse mb-2" />
                    ))
                  ) : decks.length > 0 ? (
                    decks.map(deck => (
                      <Reorder.Item
                        key={deck.id}
                        value={deck}
                        role="button"
                        tabIndex={0}
                        onClick={() => loadDeckCards(deck)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            loadDeckCards(deck);
                          }
                        }}
                        className={cn(
                          "w-full text-left p-4 rounded-2xl transition-all group flex items-center justify-between mb-2 relative overflow-hidden cursor-pointer",
                          activeDeck?.id === deck.id 
                            ? "bg-purple-600/20 border border-purple-500/50 shadow-lg shadow-purple-500/5" 
                            : "bg-slate-800/20 border border-transparent hover:border-slate-700 hover:bg-slate-800/40"
                        )}
                      >
                        <div className="flex items-center gap-4 relative z-10">
                          <div className="flex items-center gap-2">
                            <div className="text-slate-600 group-hover:text-slate-400 p-1 rounded cursor-grab active:cursor-grabbing">
                               <GripVertical className="w-4 h-4" />
                            </div>
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                              activeDeck?.id === deck.id ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-400"
                            )}>
                               <Layers className="w-5 h-5" />
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-100 truncate max-w-[140px]">{deck.topic}</p>
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">{deck.cardCount || 0} Cards</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 relative z-10">
                           <Button 
                               variant="ghost" size="icon" 
                               className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 transition-all"
                               onClick={(e) => deleteDeck(e, deck.id)}
                           >
                              <Trash2 className="w-4 h-4" />
                           </Button>
                           <ChevronRight className={cn(
                             "w-4 h-4 transition-transform",
                             activeDeck?.id === deck.id ? "text-purple-400 translate-x-1" : "text-slate-700 group-hover:translate-x-1"
                           )} />
                        </div>
                      </Reorder.Item>
                    ))
                  ) : (
                    <div className="text-center py-20 px-8 text-slate-600">
                       <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 opacity-20">
                          <Brain className="w-8 h-8" />
                       </div>
                       <p className="text-sm font-medium">No decks found</p>
                       <p className="text-[10px] uppercase tracking-widest mt-1">Start by typing above</p>
                    </div>
                  )}
                </Reorder.Group>
             </Card>
          </div>

          {/* Main Space */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {activeDeck ? (
                <motion.div 
                  key={activeDeck.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Active Deck Hero */}
                  <Card className="bg-slate-900 border-slate-800 p-8 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                      <Sparkles className="w-48 h-48 text-purple-500" />
                    </div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                       <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-purple-600/20 text-purple-400 text-[10px] font-black uppercase tracking-widest border border-purple-500/20">
                              Active Workspace
                            </span>
                          </div>
                          <h2 className="text-4xl font-bold text-white tracking-tight uppercase">{activeDeck.topic}</h2>
                          <div className="flex items-center gap-4 text-slate-400 text-sm">
                             <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> {cards.length} Cards</span>
                             <span className="flex items-center gap-1.5"><History className="w-3.5 h-3.5" /> {activeDeck.createdAt ? (activeDeck.createdAt.toDate ? activeDeck.createdAt.toDate() : new Date(activeDeck.createdAt)).toLocaleDateString() : 'N/A'}</span>
                          </div>
                       </div>
                       
                       <div className="flex gap-4">
                         <Button 
                           onClick={handleGenerateQuiz}
                           disabled={isGeneratingQuiz || cards.length < 3}
                           variant="outline"
                           size="lg"
                           className="h-14 border-slate-700 text-white rounded-2xl px-8 font-bold"
                         >
                           {isGeneratingQuiz ? <Loader2 className="w-5 h-5 animate-spin" /> : <ClipboardList className="w-5 h-5 mr-2" />}
                           Generate Quiz
                         </Button>
                         <Button 
                           onClick={startStudy}
                           disabled={cards.length === 0}
                           size="lg"
                           className="h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl shadow-xl shadow-purple-500/20 px-8 font-bold text-lg"
                         >
                           <Play className="w-5 h-5 mr-2" />
                           Study Deck
                         </Button>
                       </div>
                    </div>
                  </Card>

                  {/* Add Card / Card List Tabs */}
                  <div className="flex items-center justify-between">
                     <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-600">Card Management</h3>
                     <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleGenerateQuiz}
                          disabled={isGeneratingQuiz || cards.length < 3}
                          className="rounded-xl border-slate-800 bg-slate-900 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all font-bold"
                        >
                          {isGeneratingQuiz ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileQuestion className="w-3.5 h-3.5 mr-2" />}
                          AI Quiz
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={startStudy}
                          disabled={cards.length === 0}
                          className="rounded-xl border-slate-800 bg-slate-900 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/50 transition-all font-bold"
                        >
                          <Play className="w-3.5 h-3.5 mr-2" />
                          Launch Study
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setIsAddingCard(!isAddingCard)}
                          className={cn(
                            "rounded-xl border-slate-800 transition-all",
                            isAddingCard ? "bg-purple-600 text-white border-purple-500" : "bg-slate-900 text-slate-400"
                          )}
                        >
                          {isAddingCard ? <X className="w-4 h-4 mr-2" /> : <PlusCircle className="w-4 h-4 mr-2" />}
                          {isAddingCard ? "Close Editor" : "New Flashcard"}
                        </Button>
                     </div>
                  </div>

                  {isAddingCard && (
                    <motion.div 
                       initial={{ opacity: 0, height: 0 }}
                       animate={{ opacity: 1, height: 'auto' }}
                       className="overflow-hidden"
                    >
                       <Card className="bg-slate-800/10 border-slate-800 p-8 rounded-3xl">
                          <form onSubmit={handleAddCard} className="space-y-6">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Front Side (Question)</label>
                                   <Input 
                                      ref={frontInputRef}
                                      placeholder="What is active recall?" 
                                      className="h-14 bg-slate-900 border-slate-800 text-white rounded-2xl focus:ring-purple-500"
                                      value={newCardFront}
                                      onChange={(e) => setNewCardFront(e.target.value)}
                                      required
                                   />
                                </div>
                                <div className="space-y-2">
                                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Back Side (Answer)</label>
                                   <Input 
                                      placeholder="Retrieving information from memory..." 
                                      className="h-14 bg-slate-900 border-slate-800 text-white rounded-2xl focus:ring-purple-500"
                                      value={newCardBack}
                                      onChange={(e) => setNewCardBack(e.target.value)}
                                      required
                                   />
                                </div>
                             </div>
                             <div className="flex justify-end gap-3">
                                <Button 
                                   type="button" 
                                   variant="ghost"
                                   onClick={() => setIsAddingCard(false)}
                                   className="text-slate-500 hover:text-white"
                                >
                                   Finish Adding
                                </Button>
                                <Button 
                                   type="submit" 
                                   disabled={isSavingCard}
                                   className="bg-white text-black hover:bg-slate-200 rounded-xl px-12 font-bold h-12 shadow-xl shadow-white/5"
                                >
                                   {isSavingCard ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                                   Add Card
                                </Button>
                             </div>
                           </form>
                       </Card>
                    </motion.div>
                  )}

                  {/* Cards Grid */}
                  <Reorder.Group 
                    axis="y" 
                    values={cards} 
                    onReorder={setCards}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {loadingCards ? (
                      Array(2).fill(0).map((_, i) => (
                        <div key={i} className="h-32 bg-slate-900/50 rounded-3xl animate-pulse" />
                      ))
                    ) : cards.length > 0 ? (
                      <AnimatePresence mode="popLayout">
                        {cards.map((card) => (
                          <Reorder.Item 
                            key={card.id} 
                            value={card}
                            className="perspective-1000"
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -10 }}
                            layout
                            transition={{ 
                              type: "spring",
                              stiffness: 350,
                              damping: 30,
                              layout: { duration: 0.2, type: "tween" }
                            }}
                          >
                             <FlashcardItem card={card} onDelete={() => handleDeleteCard(card.id)} />
                          </Reorder.Item>
                        ))}
                      </AnimatePresence>
                    ) : (
                      <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-800 rounded-[3rem]">
                         <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800">
                            <Plus className="w-8 h-8 text-slate-700" />
                         </div>
                         <h4 className="text-white font-bold mb-1">Deck is empty</h4>
                         <p className="text-slate-500 text-xs mb-6">Add cards manually or use AI to generate them.</p>
                         <Button 
                           variant="outline" 
                           onClick={() => setIsAddingCard(true)}
                           className="rounded-xl border-slate-800 text-slate-300"
                         >
                           Add First Card
                         </Button>
                      </div>
                    )}
                  </Reorder.Group>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-center p-12 border-2 border-dashed border-slate-800/50 rounded-[3rem]">
                   <div className="w-24 h-24 bg-purple-600/10 rounded-[2.5rem] flex items-center justify-center mb-8 rotate-3 shadow-2xl shadow-purple-500/5 ring-1 ring-purple-500/20">
                      <BookOpen className="w-12 h-12 text-purple-500" />
                   </div>
                   <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Select a Deck to Study</h2>
                   <p className="text-slate-400 max-w-sm mx-auto mb-10 leading-relaxed">
                     Choose a deck from your library to start managing cards or launch an interactive study session.
                   </p>
                   {decks.length === 0 && !loadingDecks && (
                      <div className="flex flex-col items-center animate-bounce">
                         <p className="text-xs text-purple-400 font-black uppercase tracking-[0.2em] mb-4">Start here</p>
                         <div className="w-1 px-1 py-4 bg-purple-500 rounded-full" />
                      </div>
                   )}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

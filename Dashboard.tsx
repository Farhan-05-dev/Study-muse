import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import DashHome from './dashboard/DashHome';
import AIChat from './dashboard/AIChat';
import Pomodoro from './dashboard/Pomodoro';
import Planner from './dashboard/Planner';
import NotesGen from './dashboard/NotesGen';
import Flashcards from './dashboard/Flashcards';
import QuizGen from './dashboard/QuizGen';
import ResumeAnalyzer from './dashboard/ResumeAnalyzer';
import Roadmap from './dashboard/Roadmap';
import PDFAnalyzer from './dashboard/PDFAnalyzer';
import Analytics from './dashboard/Analytics';
import Settings from './dashboard/Settings';
import Admin from './dashboard/Admin';
import FeedbackButton from '@/components/dashboard/FeedbackButton';
import Footer from '@/components/layout/Footer';

// Fluid slide-up and fade transition for study pages
function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="h-full w-full"
    >
      {children}
    </motion.div>
  );
}

export default function Dashboard() {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={cn(
        "flex-1 min-h-screen flex flex-col transition-all duration-300",
        isCollapsed ? "ml-20" : "ml-64"
      )}>
        <div className="flex-1 p-6 md:p-8">
          <Routes>
            <Route index element={<AnimatedPage><DashHome /></AnimatedPage>} />
            <Route path="chat" element={<AnimatedPage><AIChat /></AnimatedPage>} />
            <Route path="pomodoro" element={<AnimatedPage><Pomodoro /></AnimatedPage>} />
            <Route path="planner" element={<AnimatedPage><Planner /></AnimatedPage>} />
            <Route path="notes" element={<AnimatedPage><NotesGen /></AnimatedPage>} />
            <Route path="flashcards" element={<AnimatedPage><Flashcards /></AnimatedPage>} />
            <Route path="quiz" element={<AnimatedPage><QuizGen /></AnimatedPage>} />
            <Route path="roadmap" element={<AnimatedPage><Roadmap /></AnimatedPage>} />
            <Route path="pdf-analyzer" element={<AnimatedPage><PDFAnalyzer /></AnimatedPage>} />
            <Route path="resume" element={<AnimatedPage><ResumeAnalyzer /></AnimatedPage>} />
            <Route path="analytics" element={<AnimatedPage><Analytics /></AnimatedPage>} />
            <Route path="settings" element={<AnimatedPage><Settings /></AnimatedPage>} />
            <Route path="admin" element={<AnimatedPage><Admin /></AnimatedPage>} />
          </Routes>
        </div>
        <Footer />
      </main>
      <FeedbackButton />
    </div>
  );
}


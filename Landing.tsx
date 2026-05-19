import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  BrainCircuit, 
  Layers, 
  Timer, 
  FileText, 
  BarChart3, 
  ChevronRight,
  GraduationCap,
  Zap,
  CheckCircle2,
  LucideIcon
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const FeatureCard = ({ icon: Icon, title, description, delay }: { icon: LucideIcon, title: string, description: string, delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    viewport={{ once: true }}
    className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm hover:border-purple-500/50 transition-colors group"
  >
    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
      <Icon className="w-6 h-6 text-purple-400" />
    </div>
    <h3 className="text-xl font-semibold mb-2 text-white">{title}</h3>
    <p className="text-slate-300 text-sm leading-relaxed">{description}</p>
  </motion.div>
);

import Footer from '@/components/layout/Footer';

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-purple-500/30">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px] animate-pulse delay-700" />
        </div>

        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700 text-xs font-medium text-purple-400 mb-8">
              <Zap className="w-3 h-3" />
              <span>The Next Generation of Learning</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-white via-white to-slate-300 bg-clip-text text-transparent">
              Your AI Study Partner
            </h1>
            <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              Chat with AI, generate notes, quiz yourself, build flashcards, and plan your study sessions — all in one powerful, beautifully designed app.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                onClick={() => navigate(user ? '/dashboard' : '/signup')}
                size="lg" className="h-12 px-8 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)]"
              >
                {user ? 'Go to Dashboard' : 'Get Started Free'} <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
              {!user && (
                <Button 
                  onClick={() => navigate('/login')}
                  variant="outline" size="lg" className="h-12 px-8 rounded-xl border-slate-700 hover:bg-slate-800 text-white transition-all"
                >
                  Sign In
                </Button>
              )}
            </div>
          </motion.div>

          {/* App Preview Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-20 relative px-4"
          >
            <div className="relative mx-auto max-w-5xl rounded-2xl border border-slate-800 bg-slate-900/50 p-2 backdrop-blur-xl shadow-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <img 
                src="/src/assets/images/regenerated_image_1779157588673.png" 
                alt="App Dashboard Preview" 
                className="w-full h-auto rounded-xl opacity-80"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center ring-1 ring-white/20">
                  <GraduationCap className="w-10 h-10 text-white" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">Powerful AI Tools</h2>
            <p className="text-slate-400">Everything you need to master your studies in one place.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={BrainCircuit}
              title="AI Chat Assistant"
              description="Instantly get answers to complex questions, explanations for hard topics, and step-by-step problem solving."
              delay={0.1}
            />
            <FeatureCard 
              icon={BookOpen}
              title="Notes Generator"
              description="Transform messy lectures or long articles into structured, beautiful study notes automatically."
              delay={0.2}
            />
            <FeatureCard 
              icon={Layers}
              title="Flashcard Decks"
              description="Generate smart flashcards from your notes and study with an optimized active recall system."
              delay={0.3}
            />
            <FeatureCard 
              icon={Timer}
              title="Pomodoro Timer"
              description="Boost focus with specialized study-break intervals and tracks your productivity over time."
              delay={0.4}
            />
            <FeatureCard 
              icon={FileText}
              title="Resume Builder"
              description="Create professional, ATS-friendly resumes with AI-enhanced bullet points and summaries."
              delay={0.5}
            />
            <FeatureCard 
              icon={BarChart3}
              title="Study Analytics"
              description="Visualize your progress, track streaks, and see where you spend your focus hours."
              delay={0.6}
            />
          </div>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="py-20 px-4 border-y border-border bg-background">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-12 md:gap-24 opacity-60">
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-1">50K+</div>
            <div className="text-sm text-slate-400 uppercase tracking-widest">Active Students</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-1">1M+</div>
            <div className="text-sm text-slate-400 uppercase tracking-widest">Notes Generated</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-1">99%</div>
            <div className="text-sm text-slate-400 uppercase tracking-widest">Satisfaction</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 overflow-hidden relative border-b border-white/5">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-64 bg-purple-600/20 blur-[100px] -z-10" />
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-8 text-white">Ready to Ace Your Studies?</h2>
          <p className="text-xl text-slate-400 mb-10">Join thousands of students who have transformed their learning habits with Study Muse.</p>
          <Button 
            onClick={() => navigate(user ? '/dashboard' : '/signup')}
            size="lg" className="h-14 px-10 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-bold transition-transform hover:scale-105"
          >
            {user ? 'Go to Dashboard' : 'Start Your Journey Now'}
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}


import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Flame, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Zap,
  BookOpen,
  Plus,
  GraduationCap,
  Sparkles,
  Star
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { collection, query, where, getCountFromServer, getDocs, limit, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ icon: Icon, label, value, color, delay }: { icon: any, label: string, value: string, color: string, delay: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4, delay }}
  >
    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-2 rounded-lg", color)}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <TrendingUp className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="space-y-1">
          <h3 className="text-2xl font-bold text-white">{value}</h3>
          <p className="text-sm text-slate-400">{label}</p>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

import { useGamification } from '@/hooks/useGamification';

export default function DashHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { stats: gStats, progress, xpToNextLevel } = useGamification();
  const [stats, setStats] = useState({
    notesCount: 0,
    quizzesCount: 0,
  });
  const [recentNotes, setRecentNotes] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchRecent();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;
    try {
      const notesQ = query(collection(db, 'notes'), where('userId', '==', user.uid));
      const quizzesQ = query(collection(db, 'quizzes'), where('userId', '==', user.uid));
      
      const notesSnapshot = await getCountFromServer(notesQ);
      const quizzesSnapshot = await getCountFromServer(quizzesQ);

      setStats({
        notesCount: notesSnapshot.data().count,
        quizzesCount: quizzesSnapshot.data().count
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchRecent = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'notes'), 
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(4)
      );
      const querySnapshot = await getDocs(q);
      const notes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecentNotes(notes);
    } catch (error) {
      console.error("Error fetching recent notes:", error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">
            Welcome back, {user?.displayName?.split(' ')[0] || 'Scholar'}! 👋
          </h1>
          <p className="text-slate-500 font-medium italic">"Your future is being built today, one study session at a time."</p>
        </div>
        <Button 
          onClick={() => navigate('/dashboard/roadmap')}
          className="bg-white text-black hover:bg-slate-200 rounded-2xl h-12 px-8 gap-2 font-black uppercase tracking-tight shadow-xl shadow-white/5"
        >
          <Sparkles className="w-4 h-4" />
          Quick Roadmap
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Trophy} 
          label="Current Level" 
          value={`Level ${gStats?.level || 1}`} 
          color="bg-indigo-600 shadow-lg shadow-indigo-500/20" 
          delay={0.1}
        />
        <StatCard 
          icon={Flame} 
          label="Daily Streak" 
          value={`${gStats?.streak || 0} Days`} 
          color="bg-orange-600 shadow-lg shadow-orange-500/20" 
          delay={0.2}
        />
        <StatCard 
          icon={Zap} 
          label="Total XP" 
          value={(gStats?.xp || 0).toLocaleString()} 
          color="bg-purple-600 shadow-lg shadow-purple-500/20" 
          delay={0.3}
        />
        <StatCard 
          icon={CheckCircle} 
          label="Badges Unlocked" 
          value={(gStats?.badges?.length || 0).toString()} 
          color="bg-emerald-600 shadow-lg shadow-emerald-500/20" 
          delay={0.4}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
              <Clock className="w-6 h-6 text-indigo-400" />
              Latest Sessions
            </h2>
            <Button variant="ghost" className="text-xs font-black uppercase text-slate-500 hover:text-white" onClick={() => navigate('/dashboard/notes')}>View All</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentNotes.length > 0 ? recentNotes.map((note) => (
              <Card 
                key={note.id} 
                className="bg-slate-900/40 border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer group rounded-2xl overflow-hidden"
                onClick={() => navigate('/dashboard/notes')}
              >
                <CardContent className="p-5 flex gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center group-hover:bg-indigo-600/20 transition-colors shrink-0">
                    <BookOpen className="w-7 h-7 text-slate-500 group-hover:text-indigo-400" />
                  </div>
                  <div className="overflow-hidden space-y-1">
                    <h4 className="font-bold text-white truncate text-base">{note.topic}</h4>
                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">Document • AI Generated</p>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="md:col-span-2 text-center py-16 bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl text-slate-600">
                <p className="font-bold uppercase text-xs tracking-widest">No recent study sessions found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Gamification Sidebar */}
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Your Progress</h2>
          <Card className="bg-gradient-to-br from-indigo-950 to-purple-900 border-none text-white overflow-hidden relative rounded-3xl shadow-2xl">
            <div className="absolute -right-8 -top-8 p-8 opacity-10 rotate-12">
              <Trophy className="w-40 h-40" />
            </div>
            <CardContent className="p-8 relative space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <h3 className="text-2xl font-black uppercase tracking-tight">LEVEL {gStats?.level || 1}</h3>
                  <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">{xpToNextLevel} XP to Level UP</span>
                </div>
                <div className="w-full h-4 bg-black/30 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_15px_rgba(129,140,248,0.5)]" 
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-indigo-300 tracking-widest">Earned Badges</h4>
                <div className="flex flex-wrap gap-2">
                   {gStats?.badges?.length ? gStats.badges.map(b => (
                     <div key={b} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 group cursor-help transition-all hover:scale-110 hover:bg-white/20" title={b}>
                        <Star className="w-5 h-5 text-yellow-400 group-hover:rotate-12 transition-transform" />
                     </div>
                   )) : (
                     <p className="text-xs text-indigo-300/50 italic font-medium">Keep studying to earn badges!</p>
                   )}
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 space-y-4">
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-indigo-300 font-bold uppercase tracking-widest">Global Rank</span>
                    <span className="text-white font-black">#1,240</span>
                 </div>
                 <Button className="w-full bg-white text-indigo-900 font-black uppercase text-xs h-10 rounded-xl hover:bg-indigo-50">
                    View Leaderboard
                 </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

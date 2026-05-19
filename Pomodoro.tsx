import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Coffee, 
  Focus, 
  Bell,
  Settings2,
  Volume2,
  VolumeX,
  Plus,
  Minus,
  Loader2,
  Music,
  Sliders,
  Volume1,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
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
  Timestamp,
  getCountFromServer
} from 'firebase/firestore';

type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';

import { useGamification } from '@/hooks/useGamification';

export default function Pomodoro() {
  const { user } = useAuth();
  const { addXP } = useGamification();
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  
  // Customizable durations in minutes
  const [pomodoroSettings, setPomodoroSettings] = useState(25);
  const [shortBreakSettings, setShortBreakSettings] = useState(5);
  const [longBreakSettings, setLongBreakSettings] = useState(15);
  
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [totalFocusedTime, setTotalFocusedTime] = useState(0);
  const [loadingStats, setLoadingStats] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);

  // Soundscape track states
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState(0);
  const [soundVolume, setSoundVolume] = useState(0.4);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const tracks = [
    { name: "Coffee Shop Cozy", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", desc: "Warm chatter and acoustic keys" },
    { name: "Lo-Fi Midnight Beats", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", desc: "Smooth chill drums & basslines" },
    { name: "Deep Focus Ambient", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", desc: "Ethereal pads and calm wind" },
    { name: "Serene Wilderness", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3", desc: "Soft synth lines and nature vibes" }
  ];

  const settings = {
    pomodoro: pomodoroSettings * 60,
    shortBreak: shortBreakSettings * 60,
    longBreak: longBreakSettings * 60,
  };

  // Soundscape playback control
  useEffect(() => {
    if (isPlayingSound) {
      if (!audioRef.current) {
        audioRef.current = new Audio(tracks[selectedTrack].url);
        audioRef.current.loop = true;
      } else {
        audioRef.current.src = tracks[selectedTrack].url;
      }
      audioRef.current.volume = soundVolume;
      audioRef.current.play().catch(e => console.log("Audio playback was blocked or failed:", e));
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [isPlayingSound, selectedTrack]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = soundVolume;
    }
  }, [soundVolume]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Sync timeLeft when custom settings are updated and timer has not started
  useEffect(() => {
    if (!isActive) {
      setTimeLeft(settings[mode]);
    }
  }, [pomodoroSettings, shortBreakSettings, longBreakSettings, mode, isActive]);

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  const fetchSessions = async () => {
    if (!user) return;
    setLoadingStats(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const q = query(
        collection(db, 'study_sessions'),
        where('userId', '==', user.uid),
        where('startTime', '>=', Timestamp.fromDate(today)),
        where('status', '==', 'completed'),
        where('type', '==', 'pomodoro')
      );
      
      const snapshot = await getDocs(q);
      setSessionCount(snapshot.size);
      
      let total = 0;
      snapshot.forEach(doc => {
        total += doc.data().duration || 0;
      });
      setTotalFocusedTime(Math.round(total / 60)); // in minutes
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const saveSession = async () => {
    if (!user) return;
    try {
      const duration = settings[mode];
      await addDoc(collection(db, 'study_sessions'), {
        userId: user.uid,
        startTime: serverTimestamp(),
        endTime: serverTimestamp(),
        duration: duration,
        type: mode,
        status: 'completed'
      });
      if (mode === 'pomodoro') {
        addXP(50, "Full Pomodoro Session Completed");
        fetchSessions();
      } else {
        addXP(10, "Break Session Completed");
      }
    } catch (error) {
      console.error("Error saving session:", error);
    }
  };

  const switchMode = useCallback((newMode: TimerMode) => {
    setMode(newMode);
    let durationMins = 25;
    if (newMode === 'pomodoro') durationMins = pomodoroSettings;
    else if (newMode === 'shortBreak') durationMins = shortBreakSettings;
    else if (newMode === 'longBreak') durationMins = longBreakSettings;
    setTimeLeft(durationMins * 60);
    setIsActive(false);
  }, [pomodoroSettings, shortBreakSettings, longBreakSettings]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      saveSession();
      if (!isMuted) {
        const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
        audio.play().catch(() => {});
      }
      toast.success(mode === 'pomodoro' ? "Time's up! Take a break." : "Break over! Ready to focus?");
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode, isMuted, user]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (timeLeft / settings[mode]) * 100;

  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl font-extrabold text-white mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500 tracking-tighter">Focus Timer</h1>
        <p className="text-slate-400 font-medium">Maximize your productivity using the Pomodoro technique</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full items-start">
        {/* Left Side: Stats/Settings */}
        <div className="space-y-6">
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl border-t-2 border-t-purple-500/50">
            <CardContent className="p-6">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Today's Progress</h3>
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Goal Reached</p>
                    <p className="text-2xl font-bold text-white">{sessionCount} <span className="text-sm text-slate-500 font-normal">/ 10</span></p>
                  </div>
                  <div className="text-right">
                     <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Time</p>
                     <p className="text-xl font-bold text-white">{Math.floor(totalFocusedTime / 60)}h {totalFocusedTime % 60}m</p>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(sessionCount / 10) * 100}%` }}
                    className="h-full bg-gradient-to-r from-purple-600 to-blue-500 shadow-[0_0_15px_rgba(147,51,234,0.5)]" 
                  />
                </div>
                <p className="text-[10px] text-center text-slate-500 font-medium italic">
                  {sessionCount >= 10 ? "Daily goal achieved! Genius! 🏆" : "Keep going, consistency is key! 💎"}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Button 
            variant="outline" 
            onClick={() => setIsCustomizing(true)}
            className="w-full h-12 rounded-xl border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850 gap-2 transition-all cursor-pointer"
          >
            <Settings2 className="w-4 h-4 text-purple-400" />
            Customize Intervals
          </Button>

          {/* Muse Ambient Soundscapes Card */}
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl border-t-2 border-t-indigo-500/50">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Music className="w-3.5 h-3.5 text-indigo-400" />
                  Focus Soundscapes
                </h3>
                {isPlayingSound && (
                  <div className="flex items-end gap-0.5 h-3.5 shrink-0">
                    <motion.span animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-0.5 bg-indigo-400" />
                    <motion.span animate={{ height: [8, 4, 12, 8] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.1 }} className="w-0.5 bg-indigo-400" />
                    <motion.span animate={{ height: [2, 10, 2] }} transition={{ repeat: Infinity, duration: 0.5, delay: 0.2 }} className="w-0.5 bg-indigo-400" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {tracks.map((track, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (selectedTrack === idx) {
                        setIsPlayingSound(!isPlayingSound);
                      } else {
                        setSelectedTrack(idx);
                        setIsPlayingSound(true);
                      }
                    }}
                    className={cn(
                      "w-full text-left p-3 rounded-xl border transition-all text-xs flex items-center justify-between cursor-pointer group",
                      selectedTrack === idx && isPlayingSound
                        ? "bg-indigo-600/15 border-indigo-500/30 text-white"
                        : "bg-slate-950/40 border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700"
                    )}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-bold truncate">{track.name}</p>
                      <p className="text-[9px] uppercase tracking-tighter text-slate-500 font-medium group-hover:text-slate-400 transition-colors">{track.desc}</p>
                    </div>
                    {selectedTrack === idx && isPlayingSound ? (
                      <Pause className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <Play className="w-4 h-4 text-slate-600 group-hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-all" />
                    )}
                  </button>
                ))}
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 leading-none">
                    <Volume1 className="w-3.5 h-3.5 text-slate-450" /> Volume
                  </span>
                  <span>{Math.round(soundVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={soundVolume}
                  onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center: Main Timer */}
        <div className="md:col-span-2 flex flex-col items-center gap-8">
          <Tabs value={mode} onValueChange={(v) => switchMode(v as TimerMode)} className="w-full max-w-md">
            <TabsList className="bg-slate-900 border border-slate-800 p-1.5 rounded-2xl w-full h-14 shadow-2xl">
              <TabsTrigger value="pomodoro" className="rounded-xl flex-1 data-[state=active]:bg-purple-600 data-[state=active]:text-white font-bold text-xs uppercase tracking-widest transition-all">Focus</TabsTrigger>
              <TabsTrigger value="shortBreak" className="rounded-xl flex-1 data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-bold text-xs uppercase tracking-widest transition-all">Break</TabsTrigger>
              <TabsTrigger value="longBreak" className="rounded-xl flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold text-xs uppercase tracking-widest transition-all">Rest</TabsTrigger>
            </TabsList>
          </Tabs>

          <Card className="bg-slate-900/50 border-slate-800 p-12 rounded-[3rem] w-full max-w-md relative overflow-hidden group shadow-2xl ring-1 ring-white/5">
            {/* Background Glow */}
            <div className={cn(
               "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 blur-[120px] opacity-20 -z-10 transition-colors duration-1000",
               mode === 'pomodoro' ? 'bg-purple-600' : mode === 'shortBreak' ? 'bg-emerald-600' : 'bg-blue-600'
            )} />
            
            <CardContent className="flex flex-col items-center gap-10 p-0">
              <div className="relative w-72 h-72">
                {/* SVG Progress Circle */}
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="144"
                    cy="144"
                    r="132"
                    className="stroke-slate-800/50 fill-none"
                    strokeWidth="12"
                  />
                  <motion.circle
                    cx="144"
                    cy="144"
                    r="132"
                    className={cn(
                      "fill-none transition-colors duration-500",
                      mode === 'pomodoro' ? 'stroke-purple-600' : mode === 'shortBreak' ? 'stroke-emerald-600' : 'stroke-blue-600'
                    )}
                    strokeWidth="12"
                    strokeDasharray="829"
                    animate={{ strokeDashoffset: 829 - (829 * progress) / 100 }}
                    transition={{ duration: 1, ease: "linear" }}
                    strokeLinecap="round"
                    style={{ filter: `drop-shadow(0 0 12px ${mode === 'pomodoro' ? 'rgba(147,51,234,0.4)' : mode === 'shortBreak' ? 'rgba(16,185,129,0.4)' : 'rgba(59,130,246,0.4)'})` }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span 
                    animate={{ scale: isActive ? [1, 1.02, 1] : 1 }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="text-7xl font-black font-mono text-white tracking-tighter tabular-nums"
                  >
                    {formatTime(timeLeft)}
                  </motion.span>
                  <div className="flex items-center gap-2 mt-4 text-slate-500">
                     {mode === 'pomodoro' ? <Focus className="w-3 h-3" /> : <Coffee className="w-3 h-3" />}
                     <span className="text-[10px] uppercase tracking-[0.3em] font-black">
                       {mode === 'pomodoro' ? 'Concentrating' : 'Recharging'}
                     </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="w-14 h-14 rounded-2xl border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white hover:bg-slate-800 transition-all active:scale-90"
                  onClick={() => {
                    setIsActive(false);
                    setTimeLeft(settings[mode]);
                  }}
                >
                  <RotateCcw className="w-6 h-6" />
                </Button>
                
                <Button 
                  size="lg" 
                  className={cn(
                    "h-20 px-12 rounded-[2rem] text-2xl font-black shadow-2xl transition-all hover:scale-105 active:scale-95 min-w-[180px] uppercase tracking-widest",
                    isActive 
                      ? "bg-slate-800 text-white hover:bg-slate-700 ring-2 ring-white/10" 
                      : (mode === 'pomodoro' 
                        ? "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20" 
                        : mode === 'shortBreak' 
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                          : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20")
                  )}
                  onClick={() => setIsActive(!isActive)}
                >
                  {isActive ? <Pause className="w-8 h-8 mr-2 fill-current" /> : <Play className="w-8 h-8 mr-2 fill-current" />}
                  {isActive ? 'Pause' : 'Start'}
                </Button>

                <Button 
                  size="icon" 
                  variant="outline" 
                  className="w-14 h-14 rounded-2xl border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white hover:bg-slate-800 transition-all active:scale-90"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Customize Intervals Dialog */}
      <Dialog open={isCustomizing} onOpenChange={setIsCustomizing}>
        <DialogContent className="sm:max-w-[420px] bg-slate-950 border border-slate-800/80 rounded-3xl p-6 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-white flex items-center gap-2">
              <Settings2 className="w-6 h-6 text-purple-400" />
              Interval Settings
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-medium text-xs">
              Tailor Focus, Break, and Rest durations to match your learning pace perfectly.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2 col-span-1">
                <Label className="text-[10px] font-black uppercase text-purple-400 tracking-wider">Focus (Mins)</Label>
                <Input
                  type="number"
                  min="1"
                  max="120"
                  value={pomodoroSettings}
                  onChange={(e) => setPomodoroSettings(Math.max(1, parseInt(e.target.value) || 25))}
                  className="bg-slate-900 border-slate-800 focus:border-purple-500 focus:ring-purple-500/20 text-center font-bold"
                />
              </div>
              <div className="space-y-2 col-span-1">
                <Label className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Break (Mins)</Label>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  value={shortBreakSettings}
                  onChange={(e) => setShortBreakSettings(Math.max(1, parseInt(e.target.value) || 5))}
                  className="bg-slate-900 border-slate-800 focus:border-emerald-500 focus:ring-emerald-500/20 text-center font-bold"
                />
              </div>
              <div className="space-y-2 col-span-1">
                <Label className="text-[10px] font-black uppercase text-blue-400 tracking-wider">Rest (Mins)</Label>
                <Input
                  type="number"
                  min="1"
                  max="60"
                  value={longBreakSettings}
                  onChange={(e) => setLongBreakSettings(Math.max(1, parseInt(e.target.value) || 15))}
                  className="bg-slate-900 border-slate-800 focus:border-blue-500 focus:ring-blue-500/20 text-center font-bold"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black uppercase tracking-wider text-xs h-12 rounded-xl border-none shadow-xl shadow-purple-500/10"
              onClick={() => {
                setIsCustomizing(false);
                toast.success("Focus intervals updated successfully!");
              }}
            >
              Apply Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  increment,
  arrayUnion
} from 'firebase/firestore';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

export interface GamificationStats {
  xp: number;
  level: number;
  streak: number;
  badges: string[];
  lastStudyDate: string; // YYYY-MM-DD
  weeklyXP: Record<string, number>;
}

const XP_PER_LEVEL = 1000;

export function useGamification() {
  const { user } = useAuth();
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    
    try {
      const docRef = doc(db, 'gamification', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setStats(docSnap.data() as GamificationStats);
      } else {
        // Initialize stats
        const initialStats: GamificationStats = {
          xp: 0,
          level: 1,
          streak: 0,
          badges: [],
          lastStudyDate: '',
          weeklyXP: {}
        };
        await setDoc(docRef, {
          ...initialStats,
          userId: user.uid,
          updatedAt: serverTimestamp()
        });
        setStats(initialStats);
      }
    } catch (error) {
      console.error("Error fetching gamification stats:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const addXP = async (amount: number, reason?: string) => {
    if (!user || !stats) return;

    try {
      const docRef = doc(db, 'gamification', user.uid);
      const newXP = stats.xp + amount;
      const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;
      
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      let newStreak = stats.streak;
      if (stats.lastStudyDate !== today) {
        if (stats.lastStudyDate === yesterday) {
          newStreak += 1;
        } else if (!stats.lastStudyDate) {
          newStreak = 1;
        } else {
          newStreak = 1; // Streak reset
        }
      }

      const updates: any = {
        xp: increment(amount),
        updatedAt: serverTimestamp(),
        lastStudyDate: today,
        streak: newStreak
      };

      if (newLevel > stats.level) {
        updates.level = newLevel;
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#8B5CF6', '#3B82F6', '#FFD700']
        });
        toast.success(`LEVEL UP! You are now level ${newLevel} 🎉`, {
          description: "Keep going, Master Learner!",
          duration: 5000,
        });
      } else {
        toast.success(`+${amount} XP`, {
          description: reason || "Daily study progress",
        });
      }

      await updateDoc(docRef, updates);
      
      // Update local state
      setStats(prev => prev ? {
        ...prev,
        xp: prev.xp + amount,
        level: newLevel,
        streak: newStreak,
        lastStudyDate: today
      } : null);
      
    } catch (error) {
      console.error("Error adding XP:", error);
    }
  };

  const awardBadge = async (badgeId: string, badgeName: string) => {
    if (!user || !stats || stats.badges.includes(badgeId)) return;

    try {
      const docRef = doc(db, 'gamification', user.uid);
      await updateDoc(docRef, {
        badges: arrayUnion(badgeId),
        updatedAt: serverTimestamp()
      });
      
      toast.success(`UNLOCKED: ${badgeName} Badge 🏅`, {
        duration: 5000
      });
      
      setStats(prev => prev ? {
        ...prev,
        badges: [...prev.badges, badgeId]
      } : null);
    } catch (error) {
       console.error("Error awarding badge:", error);
    }
  };

  return {
    stats,
    loading,
    addXP,
    awardBadge,
    xpToNextLevel: stats ? (stats.level * XP_PER_LEVEL) - stats.xp : 0,
    progress: stats ? ((stats.xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100 : 0
  };
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  MoreHorizontal, 
  Clock, 
  Tag, 
  Calendar,
  AlertCircle,
  GripVertical,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
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
  updateDoc,
  orderBy
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '@/lib/firestore';
import { toast } from 'sonner';

type Priority = 'low' | 'medium' | 'high';
type Status = 'drafts' | 'active' | 'ready' | 'done';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  dueDate: string;
}

export default function Planner() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as Priority,
    status: 'drafts' as Status,
    dueDate: new Date().toISOString().split('T')[0]
  });

  const columns: { id: Status; label: string; color: string }[] = [
    { id: 'drafts', label: 'Drafts', color: 'border-slate-800' },
    { id: 'active', label: 'Active', color: 'border-purple-500/50' },
    { id: 'ready', label: 'Ready', color: 'border-blue-500/50' },
    { id: 'done', label: 'Done', color: 'border-emerald-500/50' },
  ];

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const q = query(
        collection(db, 'planner_tasks'), 
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const tasksFound = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      setTasks(tasksFound);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addTask = async () => {
    if (!user || !newTask.title) {
      toast.error("Please provide at least a title for the task.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, 'planner_tasks'), {
        userId: user.uid,
        ...newTask,
        createdAt: serverTimestamp()
      });
      
      const taskWithId = { id: docRef.id, ...newTask } as Task;
      setTasks(prev => [taskWithId, ...prev]);
      
      setIsAdding(false);
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        status: 'drafts',
        dueDate: new Date().toISOString().split('T')[0]
      });
      toast.success("Task added to your study schedule!");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'planner_tasks');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateStatus = async (taskId: string, newStatus: Status) => {
    try {
      await updateDoc(doc(db, 'planner_tasks', taskId), { status: newStatus });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `planner_tasks/${taskId}`);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await deleteDoc(doc(db, 'planner_tasks', taskId));
      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast.success("Task removed.");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `planner_tasks/${taskId}`);
    }
  };

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case 'high': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'medium': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  const [isPrioritizing, setIsPrioritizing] = useState(false);

  const prioritizeTasksWithAI = async () => {
    if (!user || tasks.length === 0) return;
    setIsPrioritizing(true);
    try {
      const taskList = tasks.map(t => `${t.title}: ${t.description}`).join('\n');
      const prompt = `Given the following study tasks, categorize them into high, medium, and low priority based on academic importance and typical deadlines. Return ONLY a JSON object where keys are task titles and values are "high", "medium", or "low".\n\nTasks:\n${taskList}`;
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) throw new Error('AI Prioritization failed');
      const dataResponse = await response.json();
      const content = dataResponse.choices[0].message.content;
      
      const jsonStr = content.includes('```json') 
        ? content.split('```json')[1].split('```')[0] 
        : content.includes('```') 
          ? content.split('```')[1].split('```')[0]
          : content;

      const prioritizationMap = JSON.parse(jsonStr);
      
      // Update tasks in Firestore and state
      const updatedTasks = [...tasks];
      for (const t of updatedTasks) {
        if (prioritizationMap[t.title]) {
          const newPriority = prioritizationMap[t.title] as Priority;
          await updateDoc(doc(db, 'planner_tasks', t.id), { priority: newPriority });
          t.priority = newPriority;
        }
      }
      setTasks(updatedTasks);
      toast.success("AI has prioritized your study schedule!");
    } catch (error) {
      console.error("AI Prioritization error:", error);
      toast.error("AI Prioritization failed.");
    } finally {
      setIsPrioritizing(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Study Planner</h1>
          <p className="text-muted-foreground">Organize your study tasks and track your progress.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={prioritizeTasksWithAI}
            disabled={isPrioritizing || tasks.length === 0}
            className="border-purple-500/30 bg-purple-500/5 text-purple-400 rounded-xl gap-2 font-semibold"
          >
            {isPrioritizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            AI Prioritize
          </Button>
          <Button 
            onClick={() => setIsAdding(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl gap-2 shadow-lg font-bold"
          >
            <Plus className="w-4 h-4" />
            Add New Task
          </Button>
        </div>
      </div>

      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground">Create New Task</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Add a new study objective to your planner.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title" className="text-foreground/80 font-semibold">Title</Label>
              <Input
                id="title"
                placeholder="e.g., Study Organic Chemistry Chapter 4"
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                className="bg-background/50 border-input focus:ring-purple-500"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description" className="text-foreground/80 font-semibold">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Details about what you need to cover..."
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                className="bg-background/50 border-input focus:ring-purple-500 resize-none h-24"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="priority" className="text-foreground/80 font-semibold">Priority</Label>
                <select
                  id="priority"
                  className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value as Priority})}
                >
                  <option value="low" className="bg-background">Low</option>
                  <option value="medium" className="bg-background">Medium</option>
                  <option value="high" className="bg-background">High</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dueDate" className="text-foreground/80 font-semibold">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                  className="bg-background/50 border-input focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status" className="text-foreground/80 font-semibold">Status</Label>
              <select
                id="status"
                className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={newTask.status}
                onChange={(e) => setNewTask({...newTask, status: e.target.value as Status})}
              >
                <option value="drafts" className="bg-background">Drafts</option>
                <option value="active" className="bg-background">Active</option>
                <option value="ready" className="bg-background">Ready</option>
                <option value="done" className="bg-background">Done</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAdding(false)}
              className="rounded-xl font-semibold border-border hover:bg-accent"
            >
              Cancel
            </Button>
            <Button 
              onClick={addTask}
              disabled={isSubmitting || !newTask.title}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold gap-2 px-8"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar">
        {columns.map((column) => (
          <div key={column.id} className="flex-1 min-w-[320px] flex flex-col gap-4">
            <div className={cn(
              "flex items-center justify-between px-4 py-3 border-b-2 bg-slate-900/30 rounded-t-xl",
              column.color
            )}>
              <div className="flex items-center gap-2">
                <span className={cn("w-2 h-2 rounded-full", column.id === 'active' ? 'bg-purple-500' : column.id === 'done' ? 'bg-emerald-500' : 'bg-slate-700')} />
                <h3 className="font-bold text-white uppercase tracking-wider text-xs">{column.label}</h3>
                <Badge variant="outline" className="ml-2 bg-slate-800/50 border-slate-700 text-slate-500 py-0 px-2 h-5 text-[10px]">
                  {tasks.filter(t => t.status === column.id).length}
                </Badge>
              </div>
            </div>

            <div className="flex flex-col gap-4 min-h-[60vh] bg-slate-900/10 p-2 rounded-xl">
              {isLoading ? (
                <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-slate-700" /></div>
              ) : (
                <AnimatePresence initial={false}>
                  {tasks.filter(t => t.status === column.id).map((task) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      className="group relative"
                    >
                      <Card className={cn(
                        "bg-slate-900/40 border-slate-800/80 hover:border-slate-700 transition-all shadow-xl overflow-hidden",
                        task.status === 'done' && "opacity-80 grayscale-[0.3]"
                      )}>
                        {task.status === 'done' && (
                          <motion.div
                            initial={{ x: 50, y: -50, opacity: 0 }}
                            animate={{ x: 0, y: 0, opacity: 1 }}
                            className="absolute top-0 right-0 p-2 z-10"
                          >
                            <div className="bg-emerald-500/20 rounded-full p-1 border border-emerald-500/30">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            </div>
                          </motion.div>
                        )}
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <Badge variant="outline" className={cn("text-[10px] uppercase font-black tracking-tight", getPriorityColor(task.priority))}>
                              {task.priority}
                            </Badge>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-500 hover:text-red-400" onClick={() => deleteTask(task.id)}>
                                 <Trash2 className="w-3.5 h-3.5" />
                               </Button>
                            </div>
                          </div>
                          <h4 className="font-bold text-white mb-2 leading-tight">{task.title}</h4>
                          <p className="text-xs text-slate-500 mb-5 line-clamp-2 leading-relaxed">{task.description}</p>
                          
                          <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                            <div className="flex items-center gap-2 text-slate-400">
                              <Calendar className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold uppercase">{task.dueDate}</span>
                            </div>
                            <div className="flex gap-1">
                               {column.id !== 'drafts' && (
                                 <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg hover:bg-slate-800 text-slate-500" onClick={() => updateStatus(task.id, columns[columns.findIndex(c => c.id === column.id) - 1].id)}>
                                   <ChevronLeft className="w-4 h-4" />
                                 </Button>
                               )}
                               {column.id !== 'done' && (
                                 <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg hover:bg-slate-800 text-slate-500" onClick={() => updateStatus(task.id, columns[columns.findIndex(c => c.id === column.id) + 1].id)}>
                                   <ChevronRight className="w-4 h-4" />
                                 </Button>
                               )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
              
              {!isLoading && tasks.filter(t => t.status === column.id).length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-800/50 rounded-2xl text-slate-700">
                   <AlertCircle className="w-8 h-8 mb-2 opacity-10" />
                   <p className="text-xs font-bold uppercase tracking-widest">Column Empty</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

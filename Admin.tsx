import React, { useState } from 'react';
import { 
  Users, 
  MessageSquare, 
  ShieldAlert, 
  Activity, 
  CheckCircle2, 
  Clock, 
  MoreHorizontal,
  Search,
  Filter,
  BarChart4
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Feedback {
  id: string;
  user: string;
  type: 'bug' | 'feature' | 'other';
  status: 'received' | 'reviewing' | 'fixed';
  content: string;
  date: string;
}

const MOCK_FEEDBACK: Feedback[] = [
  { id: '1', user: 'alex@example.com', type: 'bug', status: 'received', content: 'Dark mode flickering on transition.', date: '2026-05-18' },
  { id: '2', user: 'sam@example.com', type: 'feature', status: 'reviewing', content: 'Add support for LaTeX in Chat component.', date: '2026-05-17' },
  { id: '3', user: 'kim@school.edu', type: 'bug', status: 'fixed', content: 'Flashcard score not resetting.', date: '2026-05-16' },
];

export default function Admin() {
  const [feedback] = useState<Feedback[]>(MOCK_FEEDBACK);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'fixed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'reviewing': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-slate-400">System overview and user feedback management.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-6">
               <Users className="w-5 h-5 text-blue-400 mb-4" />
               <h3 className="text-2xl font-bold text-white">12.4K</h3>
               <p className="text-xs text-slate-500">Total Users</p>
            </CardContent>
         </Card>
         <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-6">
               <Activity className="w-5 h-5 text-emerald-400 mb-4" />
               <h3 className="text-2xl font-bold text-white">450ms</h3>
               <p className="text-xs text-slate-500">Avg API Latency</p>
            </CardContent>
         </Card>
         <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-6">
               <MessageSquare className="w-5 h-5 text-purple-400 mb-4" />
               <h3 className="text-2xl font-bold text-white">1.2M</h3>
               <p className="text-xs text-slate-500">AI Tokens Used</p>
            </CardContent>
         </Card>
         <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-6">
               <ShieldAlert className="w-5 h-5 text-red-400 mb-4" />
               <h3 className="text-2xl font-bold text-white">2</h3>
               <p className="text-xs text-slate-500">Active Incidents</p>
            </CardContent>
         </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Feedback Table */}
         <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
               <h2 className="text-xl font-bold text-white">User Feedback</h2>
               <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <Input placeholder="Search..." className="h-9 pl-9 w-48 bg-slate-800 border-slate-700" />
                  </div>
                  <Button variant="outline" size="sm" className="border-slate-700 text-slate-400"><Filter className="w-4 h-4 mr-2" /> Filter</Button>
               </div>
            </div>
            
            <div className="space-y-3">
               {feedback.map(item => (
                 <Card key={item.id} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
                    <CardContent className="p-4">
                       <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                             <Badge variant="outline" className={cn("text-[10px] uppercase", getStatusBadge(item.status))}>{item.status}</Badge>
                             <span className="text-[10px] text-slate-500 font-bold uppercase">{item.type}</span>
                          </div>
                          <span className="text-[10px] text-slate-600">{item.date}</span>
                       </div>
                       <p className="text-sm text-slate-300 mb-3">{item.content}</p>
                       <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">{item.user}</span>
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-400">Manage</Button>
                       </div>
                    </CardContent>
                 </Card>
               ))}
            </div>
         </div>

         {/* System Health */}
         <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">System Health</h2>
            <Card className="bg-slate-900/50 border-slate-800">
               <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                     <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-slate-500 uppercase tracking-widest">API Server</span>
                        <span className="text-emerald-400">OPERATIONAL</span>
                     </div>
                     <Progress value={99} className="h-1 bg-slate-800" />
                  </div>
                  <div className="space-y-2">
                     <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-slate-500 uppercase tracking-widest">Database</span>
                        <span className="text-emerald-400">OPERATIONAL</span>
                     </div>
                     <Progress value={100} className="h-1 bg-slate-800" />
                  </div>
                  <div className="space-y-2">
                     <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-slate-500 uppercase tracking-widest">Groq API</span>
                        <span className="text-emerald-400">OPERATIONAL</span>
                     </div>
                     <Progress value={98} className="h-1 bg-slate-800" />
                  </div>
                  <Button className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 gap-2 border-slate-700">
                     <BarChart4 className="w-4 h-4" />
                     Full Status Report
                  </Button>
               </CardContent>
            </Card>
         </div>
      </div>
    </div>
  );
}

import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

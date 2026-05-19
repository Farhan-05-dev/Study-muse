import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  Zap, 
  Target,
  Brain,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const data = [
  { name: 'Mon', hours: 4.5, focus: 85 },
  { name: 'Tue', hours: 5.2, focus: 92 },
  { name: 'Wed', hours: 3.8, focus: 78 },
  { name: 'Thu', hours: 6.5, focus: 95 },
  { name: 'Fri', hours: 4.1, focus: 88 },
  { name: 'Sat', hours: 2.5, focus: 70 },
  { name: 'Sun', hours: 1.5, focus: 60 },
];

const categoryData = [
  { name: 'Mathematics', value: 40, color: '#8884d8' },
  { name: 'Physics', value: 30, color: '#82ca9d' },
  { name: 'CS', value: 20, color: '#ffc658' },
  { name: 'Literature', value: 10, color: '#ff8042' },
];

export default function Analytics() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
          <p className="text-slate-400">Track your learning progress and productivity trends.</p>
        </div>
        <div className="flex bg-slate-900/50 border border-slate-800 rounded-xl p-1">
           <button className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-purple-600">Weekly</button>
           <button className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-300">Monthly</button>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
               <Clock className="w-6 h-6" />
            </div>
            <div>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Focus Time</p>
               <h3 className="text-2xl font-bold text-white">28.1h</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">
               <Brain className="w-6 h-6" />
            </div>
            <div>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Recall</p>
               <h3 className="text-2xl font-bold text-white">84%</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
               <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Completion</p>
               <h3 className="text-2xl font-bold text-white">92%</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-400">
               <Target className="w-6 h-6" />
            </div>
            <div>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Goals Reached</p>
               <h3 className="text-2xl font-bold text-white">12/15</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-slate-900/50 border-slate-800 p-6">
          <CardHeader className="p-0 mb-8">
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              Focus Activity (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="hours" stroke="#a78bfa" fillOpacity={1} fill="url(#colorHours)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 p-6">
          <CardHeader className="p-0 mb-8">
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Subject Distribution
            </CardTitle>
          </CardHeader>
          <div className="h-[300px] w-full flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 shrink-0 pr-8">
               {categoryData.map(item => (
                 <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-slate-400 font-medium">{item.name}</span>
                 </div>
               ))}
            </div>
          </div>
        </Card>
      </div>

      <Card className="bg-slate-900/50 border-slate-800 p-6">
         <CardHeader className="p-0 mb-8">
            <CardTitle className="text-lg font-bold text-white">Focus Score Efficiency</CardTitle>
         </CardHeader>
         <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#1e293b' }}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                />
                <Bar dataKey="focus" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
         </div>
      </Card>
    </div>
  );
}

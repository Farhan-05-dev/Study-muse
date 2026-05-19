import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  FileEdit, 
  Layers, 
  Brain, 
  Calendar, 
  Clock, 
  FileCheck, 
  BarChart, 
  Settings,
  LogOut,
  GraduationCap,
  ShieldAlert,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Map,
  FileSearch
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';

const menuItems = [
  { icon: LayoutDashboard, label: 'Home', path: '/dashboard' },
  { icon: Map, label: 'AI Roadmap', path: '/dashboard/roadmap' },
  { icon: FileSearch, label: 'PDF Analyzer', path: '/dashboard/pdf-analyzer' },
  { icon: MessageSquare, label: 'AI Chat', path: '/dashboard/chat' },
  { icon: FileEdit, label: 'Notes Gen', path: '/dashboard/notes' },
  { icon: Layers, label: 'Flashcards', path: '/dashboard/flashcards' },
  { icon: Brain, label: 'Quiz Gen', path: '/dashboard/quiz' },
  { icon: Calendar, label: 'Planner', path: '/dashboard/planner' },
  { icon: Clock, label: 'Pomodoro', path: '/dashboard/pomodoro' },
  { icon: FileCheck, label: 'AI Resume', path: '/dashboard/resume' },
  { icon: BarChart, label: 'Analytics', path: '/dashboard/analytics' },
  { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
];

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className={cn(
      "bg-sidebar border-r border-sidebar-border flex flex-col h-screen fixed left-0 top-0 z-50 transition-all duration-300",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <div className={cn(
        "p-6 flex items-center justify-between group/logo",
        isCollapsed && "px-4 justify-center"
      )}>
        <div className="flex items-center gap-2 cursor-pointer">
          <GraduationCap className="w-8 h-8 text-purple-500 group-hover/logo:rotate-12 transition-transform duration-300" />
          {!isCollapsed && (
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="text-xl font-bold text-sidebar-foreground tracking-tight group-hover/logo:text-purple-400 transition-colors duration-300"
            >
              Study Muse
            </motion.span>
          )}
        </div>
        
        {!isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all hover:rotate-12"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={theme}
                initial={{ y: -20, opacity: 0, rotate: -90 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                exit={{ y: 20, opacity: 0, rotate: 90 }}
                transition={{ duration: 0.2 }}
              >
                {theme === 'light' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </motion.div>
            </AnimatePresence>
          </Button>
        )}
      </div>

      <div className="px-4 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "w-full flex items-center justify-center h-10 rounded-xl bg-sidebar-accent/30 text-sidebar-foreground/60 hover:text-purple-400 hover:bg-sidebar-accent/50 transition-all",
            !isCollapsed && "justify-between px-4"
          )}
        >
          {!isCollapsed && <span className="text-xs font-bold uppercase tracking-widest">Collapse View</span>}
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </Button>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'}
            title={isCollapsed ? item.label : undefined}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all relative group overflow-hidden",
              isCollapsed && "justify-center px-0",
              isActive 
                ? "text-white" 
                : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
            )}
          >
            {({ isActive }) => (
              <>
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-bg"
                      className="absolute inset-0 bg-gradient-to-r from-purple-600/90 to-blue-600/90 shadow-lg shadow-purple-500/20"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </AnimatePresence>

                {isActive && (
                  <motion.div
                    layoutId="active-nav-indicator"
                    className="absolute left-0 w-1 h-6 bg-white rounded-r-full z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}

                <item.icon className={cn(
                  "w-5 h-5 transition-all duration-300 relative z-10 group-hover:scale-110",
                  isActive ? "text-white" : "text-sidebar-foreground/60 group-hover:text-purple-400",
                  isCollapsed && isActive && "scale-110"
                )} />
                
                {!isCollapsed && (
                  <span className={cn(
                    "flex-1 relative z-10 transition-transform duration-300 group-hover:translate-x-1",
                    isActive ? "font-bold" : "font-medium"
                  )}>
                    {item.label}
                  </span>
                )}

                {!isActive && (
                  <div className="absolute inset-0 bg-sidebar-accent/0 group-hover:bg-sidebar-accent/50 transition-colors" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className={cn(
        "p-4 border-t border-sidebar-border space-y-4",
        isCollapsed && "px-2"
      )}>
        <div className={cn(
          "flex items-center gap-3 px-2 group/user cursor-pointer",
          isCollapsed && "justify-center px-0"
        )}>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold group-hover/user:bg-purple-600 group-hover/user:text-white transition-all duration-300 shrink-0">
            {user?.displayName?.[0] || user?.email?.[0] || 'U'}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-sidebar-foreground truncate group-hover/user:text-white transition-colors">{user?.displayName || 'User'}</p>
              <p className="text-[10px] uppercase font-black tracking-widest text-sidebar-foreground/40 truncate">{user?.email}</p>
            </div>
          )}
        </div>
        <Button 
          variant="ghost" 
          title={isCollapsed ? "Logout" : undefined}
          className={cn(
            "w-full justify-start gap-3 text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all group/logout",
            isCollapsed && "justify-center px-0"
          )}
          onClick={logout}
        >
          <LogOut className="w-5 h-5 group-hover/logout:-translate-x-1 transition-transform" />
          {!isCollapsed && <span className="group-hover/logout:font-bold">Logout</span>}
        </Button>
      </div>
    </aside>
  );
}

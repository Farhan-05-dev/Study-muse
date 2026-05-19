import React from 'react';
import { 
  User, 
  Bell, 
  Moon, 
  Shield, 
  Database, 
  LogOut, 
  ChevronRight,
  Monitor,
  Laptop,
  Smartphone,
  Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';

const SettingItem = ({ icon: Icon, label, description, rightElement }: { icon: any, label: string, description?: string, rightElement?: React.ReactNode }) => (
  <div className="flex items-center justify-between p-4 bg-slate-900/30 border border-slate-800 rounded-2xl hover:bg-slate-900/50 transition-colors">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h4 className="font-semibold text-white">{label}</h4>
        {description && <p className="text-xs text-slate-500">{description}</p>}
      </div>
    </div>
    {rightElement || <ChevronRight className="w-4 h-4 text-slate-600" />}
  </div>
);

export default function Settings() {
  const { user, logout } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-slate-400">Manage your account preferences and application settings.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Profile */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1">Account</h2>
          <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
             <CardContent className="p-0">
                <div className="p-6 flex items-center gap-6 border-b border-slate-800">
                   <div className="w-20 h-20 rounded-2xl bg-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-purple-500/20">
                      {user?.displayName?.[0] || user?.email?.[0]}
                   </div>
                   <div className="flex-1">
                      <h3 className="text-xl font-bold text-white">{user?.displayName || 'Scholar User'}</h3>
                      <p className="text-slate-400 text-sm mb-4">{user?.email}</p>
                      <Button variant="outline" size="sm" className="h-8 border-slate-700 text-slate-400 hover:text-white">Edit Profile</Button>
                   </div>
                </div>
                <div className="p-2">
                   <SettingItem icon={Shield} label="Privacy & Security" description="Password, 2FA, and login history" />
                   <SettingItem icon={Database} label="Data Management" description="Export your data or delete account" />
                </div>
             </CardContent>
          </Card>
        </section>

        {/* Preferences */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1">App Preferences</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <SettingItem 
                icon={Moon} 
                label="Dark Mode" 
                rightElement={<Switch checked={true} />} 
              />
             <SettingItem 
                icon={Bell} 
                label="Notifications" 
                rightElement={<Switch checked={true} />} 
              />
             <SettingItem 
                icon={Globe} 
                label="Language" 
                description="English (US)" 
              />
             <SettingItem 
                icon={Monitor} 
                label="Auto Sync" 
                rightElement={<Switch checked={true} />} 
              />
          </div>
        </section>

        {/* Devices */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1">Recent Sessions</h2>
          <Card className="bg-slate-900/50 border-slate-800 p-2">
             <SettingItem icon={Laptop} label="MacBook Pro" description="New York, NY • Current session" />
             <SettingItem icon={Smartphone} label="iPhone 15 Pro" description="New York, NY • 2 hours ago" />
          </Card>
        </section>

        {/* Actions */}
        <div className="pt-4 border-t border-slate-800">
           <Button 
             variant="ghost" 
             className="text-red-400 hover:bg-red-400/10 w-full justify-start gap-3 h-12 rounded-xl"
             onClick={logout}
           >
              <LogOut className="w-5 h-5" />
              Sign Out from all devices
           </Button>
        </div>
      </div>
    </div>
  );
}

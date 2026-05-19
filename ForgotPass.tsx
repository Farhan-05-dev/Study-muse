import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { GraduationCap, Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import Footer from '@/components/layout/Footer';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Reset link sent to your email!");
    setIsSent(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[150px]" />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="flex items-center justify-center gap-2 mb-8">
            <GraduationCap className="w-10 h-10 text-purple-500" />
            <span className="text-3xl font-bold text-foreground tracking-tight">Study Muse</span>
          </div>

          <Card className="border-border bg-card/50 backdrop-blur-xl text-card-foreground">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center text-foreground">Reset password</CardTitle>
              <CardDescription className="text-center text-muted-foreground">
                Recover access to your study dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isSent ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-foreground/80">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="name@example.com" 
                          className="pl-10 bg-background/50 border-input text-foreground"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-11 bg-purple-600 hover:bg-purple-700 text-white font-bold">
                      Send Reset Link
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                </form>
              ) : (
                <div className="text-center py-4 space-y-4">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                      <Mail className="w-8 h-8 text-emerald-400" />
                    </div>
                    <p className="text-muted-foreground font-medium">Check your inbox for instructions to reset your password.</p>
                    <Button variant="outline" className="w-full border-border" onClick={() => setIsSent(false)}>
                      Resend Link
                    </Button>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Link to="/login" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto">
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}


import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquarePlus, X, Send, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setIsSubmitting(true);
    // Simulate submission to Firestore
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success("Thanks for your feedback! 🚀");
    setFeedback('');
    setRating(0);
    setIsOpen(false);
    setIsSubmitting(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl shadow-xl shadow-purple-500/20 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-50 group"
      >
        <MessageSquarePlus className="w-6 h-6 group-hover:rotate-12 transition-transform" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-end p-8 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="w-full max-w-sm pointer-events-auto"
            >
              <Card className="bg-slate-900 border-slate-800 shadow-2xl overflow-hidden backdrop-blur-xl">
                <CardHeader className="bg-slate-800/50 p-4 flex flex-row items-center justify-between border-b border-slate-800">
                  <CardTitle className="text-sm font-bold text-white uppercase tracking-widest">Share Feedback</CardTitle>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white" onClick={() => setIsOpen(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex justify-center gap-2 mb-4">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setRating(s)}
                          className={cn(
                            "w-8 h-8 flex items-center justify-center transition-colors",
                            rating >= s ? "text-yellow-500" : "text-slate-700 hover:text-slate-500"
                          )}
                        >
                          <Star className={cn("w-6 h-6", rating >= s ? "fill-current" : "")} />
                        </button>
                      ))}
                    </div>
                    
                    <Textarea 
                      placeholder="What can we improve? (Bugs, features, ideas...)"
                      className="bg-slate-800/50 border-slate-700 text-white min-h-[120px] resize-none"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      required
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold h-11"
                      disabled={isSubmitting || !feedback.trim()}
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                      Send Feedback
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

import { cn } from '@/lib/utils';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileCheck, 
  Download, 
  Plus, 
  Trash2, 
  Sparkles, 
  Loader2, 
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Briefcase,
  GraduationCap,
  Award,
  ChevronRight,
  Eye,
  Type,
  Save,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
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
  setDoc,
  getDoc,
  orderBy
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '@/lib/firestore';

interface ResumeData {
  personal: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    summary: string;
  };
  experience: {
    id: string;
    role: string;
    company: string;
    duration: string;
    content: string;
  }[];
  education: {
    id: string;
    degree: string;
    school: string;
    duration: string;
    content: string;
  }[];
  skills: string[];
}

const INITIAL_DATA: ResumeData = {
  personal: {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1 234 567 890',
    location: 'New York, NY',
    linkedin: 'linkedin.com/in/johndoe',
    summary: 'Diligent Computer Science student with a focus on AI and full-stack development.'
  },
  experience: [
    { id: '1', role: 'Software Intern', company: 'Tech Corp', duration: '2023 - Present', content: 'Developing reactive UI components using React and TypeScript.' }
  ],
  education: [
    { id: '2', degree: 'B.S. in Computer Science', school: 'Tech University', duration: '2021 - 2025', content: 'GPA: 3.9/4.0. Relevant coursework: Data Structures, AI, Web Systems.' }
  ],
  skills: ['React', 'TypeScript', 'Tailwind CSS', 'Python', 'AI/ML']
};

export default function ResumeBuilder() {
  const { user } = useAuth();
  const [data, setData] = useState<ResumeData>(INITIAL_DATA);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadResume();
    }
  }, [user]);

  const loadResume = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const docRef = doc(db, 'resumes', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setData(docSnap.data() as ResumeData);
      }
    } catch (error) {
      console.error("Error loading resume:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveResume = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'resumes', user.uid), {
        ...data,
        userId: user.uid,
        updatedAt: serverTimestamp()
      });
      toast.success("Resume saved successfully!");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `resumes/${user.uid}`);
    } finally {
      setIsSaving(false);
    }
  };

  const enhanceWithAI = async (text: string, type: string) => {
    setIsEnhancing(true);
    try {
      const prompt = `Rewrite the following ${type} to be more professional, ATS-friendly, and impactful for a resume. Keep it concise. \n\n${text}`;
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) throw new Error('AI enhancement failed');
      const dataResponse = await response.json();
      const enhancedText = dataResponse.choices[0].message.content.replace(/[""]/g, '');
      
      toast.success("AI Enhancement applied!");
      return enhancedText;
    } catch (error) {
      toast.error("AI enhancement failed.");
      return text;
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleEnhanceSummary = async () => {
    const enhanced = await enhanceWithAI(data.personal.summary, 'resume summary');
    setData({ ...data, personal: { ...data.personal, summary: enhanced } });
  };

  const exportPDF = async () => {
    const element = document.getElementById('resume-preview');
    if (!element) return;
    
    toast.promise(async () => {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${data.personal.name || 'Resume'}.pdf`);
    }, {
      loading: 'Preparing PDF...',
      success: 'Resume downloaded!',
      error: 'Failed to generate PDF'
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Resume Builder</h1>
          <p className="text-slate-400">Craft a professional resume with AI-enhanced content optimization.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="border-slate-800 text-slate-400"
            onClick={saveResume}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Progress
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={exportPDF}>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
        {/* Editor Panel */}
        <div className="space-y-6">
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm overflow-hidden min-h-[600px]">
            {isLoading ? (
               <div className="flex items-center justify-center p-24">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
               </div>
            ) : (
              <Tabs defaultValue="personal" className="w-full">
                 <TabsList className="bg-slate-900 border-b border-slate-800 w-full rounded-none h-14 p-0">
                    <TabsTrigger value="personal" className="flex-1 h-full rounded-none data-[state=active]:bg-purple-600/10 data-[state=active]:text-purple-400">Profile</TabsTrigger>
                    <TabsTrigger value="exp" className="flex-1 h-full rounded-none data-[state=active]:bg-purple-600/10 data-[state=active]:text-purple-400">Experience</TabsTrigger>
                    <TabsTrigger value="edu" className="flex-1 h-full rounded-none data-[state=active]:bg-purple-600/10 data-[state=active]:text-purple-400">Education</TabsTrigger>
                    <TabsTrigger value="skills" className="flex-1 h-full rounded-none data-[state=active]:bg-purple-600/10 data-[state=active]:text-purple-400">Skills</TabsTrigger>
                 </TabsList>
                 
                 <div className="p-6">
                    <TabsContent value="personal" className="space-y-4 m-0">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Full Name</label>
                          <Input value={data.personal.name} onChange={e => setData({...data, personal: {...data.personal, name: e.target.value}})} className="bg-slate-800/50 border-slate-700 text-white" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email</label>
                          <Input value={data.personal.email} onChange={e => setData({...data, personal: {...data.personal, email: e.target.value}})} className="bg-slate-800/50 border-slate-700 text-white" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Phone</label>
                          <Input value={data.personal.phone} onChange={e => setData({...data, personal: {...data.personal, phone: e.target.value}})} className="bg-slate-800/50 border-slate-700 text-white" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Location</label>
                          <Input value={data.personal.location} onChange={e => setData({...data, personal: {...data.personal, location: e.target.value}})} className="bg-slate-800/50 border-slate-700 text-white" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Professional Summary</label>
                          <Button variant="ghost" size="sm" className="h-6 text-[10px] text-purple-400 hover:text-purple-300 gap-1" onClick={handleEnhanceSummary} disabled={isEnhancing}>
                            {isEnhancing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            Enhance Summary
                          </Button>
                        </div>
                        <Textarea 
                          value={data.personal.summary} 
                          onChange={e => setData({...data, personal: {...data.personal, summary: e.target.value}})} 
                          className="bg-slate-800/50 border-slate-700 text-white h-32 resize-none" 
                        />
                      </div>
                    </TabsContent>
  
                    <TabsContent value="exp" className="space-y-6 m-0">
                      {data.experience.map((exp, idx) => (
                        <div key={exp.id} className="p-4 border border-slate-800 rounded-xl space-y-4">
                           <div className="grid grid-cols-2 gap-4">
                              <Input placeholder="Job Title" value={exp.role} className="bg-slate-800/50 border-slate-700" onChange={e => {
                                 const newExp = [...data.experience];
                                 newExp[idx].role = e.target.value;
                                 setData({...data, experience: newExp});
                              }} />
                              <Input placeholder="Company" value={exp.company} className="bg-slate-800/50 border-slate-700" onChange={e => {
                                 const newExp = [...data.experience];
                                 newExp[idx].company = e.target.value;
                                 setData({...data, experience: newExp});
                              }} />
                           </div>
                           <Textarea placeholder="Key achievements..." value={exp.content} className="bg-slate-800/50 border-slate-700 h-24" onChange={e => {
                                 const newExp = [...data.experience];
                                 newExp[idx].content = e.target.value;
                                 setData({...data, experience: newExp});
                              }} />
                           <div className="flex justify-end">
                              <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-400/10" onClick={() => setData({...data, experience: data.experience.filter(e => e.id !== exp.id)})}>
                                 <Trash2 className="w-4 h-4 mr-2" /> Remove
                              </Button>
                           </div>
                        </div>
                      ))}
                      <Button variant="outline" className="w-full border-dashed border-2 border-slate-800 text-slate-500 hover:bg-slate-800/50" onClick={() => setData({...data, experience: [...data.experience, { id: Date.now().toString(), role: '', company: '', duration: '2024 - Present', content: '' }]})}>
                         <Plus className="w-4 h-4 mr-2" /> Add Experience
                      </Button>
                    </TabsContent>
  
                    <TabsContent value="edu" className="space-y-6 m-0">
                       {data.education.map((edu, idx) => (
                          <div key={edu.id} className="p-4 border border-slate-800 rounded-xl space-y-4">
                             <div className="grid grid-cols-2 gap-4">
                                <Input placeholder="School" value={edu.school} className="bg-slate-800/50 border-slate-700" onChange={e => {
                                   const newEdu = [...data.education];
                                   newEdu[idx].school = e.target.value;
                                   setData({...data, education: newEdu});
                                }} />
                                <Input placeholder="Degree" value={edu.degree} className="bg-slate-800/50 border-slate-700" onChange={e => {
                                   const newEdu = [...data.education];
                                   newEdu[idx].degree = e.target.value;
                                   setData({...data, education: newEdu});
                                }} />
                             </div>
                             <Textarea value={edu.content} className="bg-slate-800/50 border-slate-700 h-24" onChange={e => {
                                   const newEdu = [...data.education];
                                   newEdu[idx].content = e.target.value;
                                   setData({...data, education: newEdu});
                                }} />
                             <div className="flex justify-end">
                                <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-400/10" onClick={() => setData({...data, education: data.education.filter(e => e.id !== edu.id)})}>
                                   <Trash2 className="w-4 h-4 mr-2" /> Remove
                                </Button>
                             </div>
                          </div>
                       ))}
                       <Button variant="outline" className="w-full border-dashed border-2 border-slate-800 text-slate-500 hover:bg-slate-800/50" onClick={() => setData({...data, education: [...data.education, { id: Date.now().toString(), school: '', degree: '', duration: '2024 - Present', content: '' }]})}>
                          <Plus className="w-4 h-4 mr-2" /> Add Education
                       </Button>
                    </TabsContent>
  
                    <TabsContent value="skills" className="m-0">
                       <div className="flex flex-wrap gap-2 mb-6">
                          {data.skills.map((skill, i) => (
                             <div key={i} className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-sm text-slate-300">
                                {skill}
                                <button onClick={() => setData({...data, skills: data.skills.filter(s => s !== skill)})}><Trash2 className="w-3 h-3 text-red-400" /></button>
                             </div>
                          ))}
                       </div>
                       <div className="flex gap-2">
                          <Input id="new-skill" placeholder="Add skill and press Enter..." className="bg-slate-800/50 border-slate-700" onKeyDown={(e) => {
                             if (e.key === 'Enter') {
                                const val = (e.target as HTMLInputElement).value;
                                if (val) setData({...data, skills: [...data.skills, val]});
                                (e.target as HTMLInputElement).value = '';
                             }
                          }} />
                       </div>
                    </TabsContent>
                 </div>
              </Tabs>
            )}
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="bg-white rounded-xl shadow-2xl p-12 text-slate-900 min-h-[800px] flex flex-col font-serif" id="resume-preview">
           <header className="mb-8 border-b-2 border-slate-900 pb-6">
              <h1 className="text-4xl font-bold mb-2 uppercase tracking-tight">{data.personal.name}</h1>
              <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-600">
                 {data.personal.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" /> {data.personal.email}</div>}
                 {data.personal.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" /> {data.personal.phone}</div>}
                 {data.personal.location && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {data.personal.location}</div>}
                 {data.personal.linkedin && <div className="flex items-center gap-1"><Linkedin className="w-3 h-3" /> {data.personal.linkedin}</div>}
              </div>
           </header>

           <section className="mb-8">
              <h2 className="text-lg font-bold uppercase border-b border-slate-200 mb-3 tracking-widest text-slate-600">Summary</h2>
              <p className="text-sm leading-relaxed text-slate-800 italic">{data.personal.summary}</p>
           </section>

           <section className="mb-8">
              <h2 className="text-lg font-bold uppercase border-b border-slate-200 mb-3 tracking-widest text-slate-600">Experience</h2>
              <div className="space-y-6">
                 {data.experience.map(exp => (
                    <div key={exp.id}>
                       <div className="flex justify-between items-baseline mb-1">
                          <h3 className="font-bold text-base">{exp.role}</h3>
                          <span className="text-xs font-bold text-slate-500 uppercase">{exp.duration}</span>
                       </div>
                       <div className="text-sm font-bold text-slate-600 mb-2">{exp.company}</div>
                       <p className="text-sm leading-relaxed text-slate-700">{exp.content}</p>
                    </div>
                 ))}
              </div>
           </section>

           <section className="mb-8">
              <h2 className="text-lg font-bold uppercase border-b border-slate-200 mb-3 tracking-widest text-slate-600">Education</h2>
              <div className="space-y-6">
                 {data.education.map(edu => (
                    <div key={edu.id}>
                       <div className="flex justify-between items-baseline mb-1">
                          <h3 className="font-bold text-base">{edu.school}</h3>
                          <span className="text-xs font-bold text-slate-500 uppercase">{edu.duration}</span>
                       </div>
                       <div className="text-sm font-bold text-slate-600 mb-1">{edu.degree}</div>
                       <p className="text-sm text-slate-700">{edu.content}</p>
                    </div>
                 ))}
              </div>
           </section>

           <section>
              <h2 className="text-lg font-bold uppercase border-b border-slate-200 mb-3 tracking-widest text-slate-600">Skills</h2>
              <p className="text-sm font-medium leading-relaxed text-slate-700">
                 {data.skills.join(' • ')}
              </p>
           </section>
        </div>
      </div>
    </div>
  );
}

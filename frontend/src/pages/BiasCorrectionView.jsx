import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Cpu, RefreshCw, Download, FileText, Bot, Sparkles } from 'lucide-react';
import axios from 'axios';

export function BiasCorrectionView() {
  const [data, setData] = useState(null);
  const [aiExplanation, setAiExplanation] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const executeCorrection = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/bias-correction');
        const decisionRes = await axios.get('http://localhost:8000/api/reconstructed-decisions');
        setData({ ...res.data, decisions: decisionRes.data });
        
        // Fetch AI Explanation
        const aiRes = await axios.get('http://localhost:8000/api/ai-explanation');
        setAiExplanation(aiRes.data.explanation);
        
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    executeCorrection();
  }, []);

  const handleDownloadCSV = () => {
    window.open('http://localhost:8000/api/download-sanitized-csv', '_blank');
  };

  const handleDownloadReport = () => {
    window.open('http://localhost:8000/api/download-audit-report', '_blank');
  };

  if (loading) return (
     <div className="flex flex-col justify-center items-center h-[60vh] space-y-4">
       <div className="relative">
         <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full animate-pulse"></div>
         <Cpu className="w-10 h-10 animate-pulse text-cyan-400 relative z-10" />
       </div>
       <p className="font-mono tracking-widest text-cyan-200 uppercase text-sm">Validating Counterfactuals...</p>
     </div>
  );

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="space-y-8 flex flex-col xl:flex-row gap-8">
      
      {/* Left Column: Metrics & Logic */}
      <div className="w-full xl:w-5/12 space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2 text-white">Correction Engine</h2>
          <p className="text-secondary font-light">Demographic Parity enforcement and Decision Boundary shifts.</p>
        </div>

        {/* Dropped Features */}
        <div className="glass-panel p-6 border-l-4 border-l-red-500 bg-red-950/10">
           <h3 className="font-mono text-gray-300 text-xs tracking-widest uppercase mb-4">Features Redacted Pre-Training</h3>
           <div className="flex gap-2 flex-wrap">
             {data?.dropped_features?.map((feat, i) => (
                <span key={i} className="px-3 py-1 bg-red-900/40 text-red-300 border border-red-500/30 rounded-full text-xs font-mono line-through">
                  {feat}
                </span>
             ))}
           </div>
        </div>

        <div className="glass-panel p-6 border-t-2 border-t-cyan-500/50">
          <div className="flex items-center space-x-3 mb-6">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
            <h3 className="font-semibold text-white tracking-wide">Before vs After Decision Reconstruction</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface/50 border border-white/5 p-5 rounded-xl text-center relative overflow-hidden group">
               <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 to-transparent"></div>
               <p className="text-[10px] font-mono text-cyan-400 tracking-widest uppercase mb-2">Biased Rejections Fixed</p>
               <p className="text-4xl font-mono font-bold text-white group-hover:scale-105 transition-transform">{data?.decisions?.newly_selected || 0}</p>
               <p className="text-[11px] text-secondary mt-3">Candidates previously blocked by proxies now <span className="text-cyan-400">Selected</span>.</p>
            </div>
            <div className="bg-surface/50 border border-white/5 p-5 rounded-xl text-center relative overflow-hidden group">
               <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 to-transparent"></div>
               <p className="text-[10px] font-mono text-red-500 tracking-widest uppercase mb-2">Unfair Advantages Removed</p>
               <p className="text-4xl font-mono font-bold text-white group-hover:scale-105 transition-transform">{data?.decisions?.newly_rejected || 0}</p>
               <p className="text-[11px] text-secondary mt-3">Candidates benefitting from data bias now <span className="text-red-500">Rejected</span>.</p>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-white/5">
             <div className="flex justify-between items-center mb-3">
               <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">Correction Net Impact Matrix</span>
               <span className="text-[10px] text-cyan-500 font-mono tracking-widest">{data?.decisions?.newly_selected + data?.decisions?.newly_rejected || 0} DELTAS RECORDED</span>
             </div>
             <div className="flex gap-1 overflow-hidden h-6 items-end rounded shrink-0 opacity-80">
               {Array.from({length: 45}).map((_, i) => {
                 const isCyan = i % 5 === 0;
                 const isRed = i % 7 === 0;
                 return (
                   <div key={i} className={`flex-1 rounded-t-sm transition-all duration-1000 ${isCyan ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]' : isRed ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-white/10' }`} style={{ height: `${Math.random() * 60 + 40}%` }}></div>
                 )
               })}
             </div>
          </div>
        </div>
      </div>

      {/* Right Column: AI Explanation & Actions */}
      <div className="w-full xl:w-7/12 flex flex-col space-y-6">
         
         {/* Action Bar */}
         <div className="glass-panel p-4 flex flex-col md:flex-row justify-between items-center gap-4 bg-white/5">
            <div className="text-sm font-mono text-secondary tracking-widest">
              EXPORT & REPORTING
            </div>
            <div className="flex space-x-4">
              <button onClick={handleDownloadCSV} className="btn-primary hover:text-cyan-400 border-white/10 group">
                <Download className="w-4 h-4 mr-2 text-secondary group-hover:text-cyan-400 transition-colors" />
                Sanitized CSV
              </button>
              <button onClick={handleDownloadReport} className="btn-accent border border-cyan-400/30">
                <FileText className="w-4 h-4 mr-2" />
                Audit Report (.TXT)
              </button>
            </div>
         </div>

         {/* AI Panel */}
         <div className="glass-panel p-0 flex flex-col shadow-none border-white/10 overflow-hidden relative group flex-1">
            {/* Header */}
            <div className="bg-gradient-to-r from-surface to-black px-6 py-4 flex items-center justify-between text-white border-b border-white/5">
              <div className="flex items-center space-x-3">
                 <div className="bg-cyan-500/20 p-2 rounded text-cyan-400"><Bot className="w-5 h-5" /></div>
                 <div>
                   <h3 className="font-bold tracking-wide text-white">ProxyShield AI Report</h3>
                   <div className="flex items-center mt-1">
                     <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse mr-2"></span>
                     <span className="text-[10px] font-mono text-green-400 tracking-widest uppercase">System Online</span>
                   </div>
                 </div>
              </div>
              <span className="text-xs font-mono bg-cyan-900/40 text-cyan-300 border border-cyan-500/30 px-2 py-1 rounded shadow-[0_0_10px_rgba(6,182,212,0.1)]">PRO-2.5</span>
            </div>
            
            {/* Content body */}
            <div className="p-8 pb-10 bg-[#0A0A0A] prose prose-invert prose-sm max-w-none text-gray-300 flex-1 overflow-y-auto custom-scrollbar">
               {aiExplanation ? (
                 <div className="whitespace-pre-line text-[14px] leading-relaxed font-light" 
                      dangerouslySetInnerHTML={{__html: aiExplanation.replace(/###\s*(.*)/g, '<br/><h4 class="text-white text-lg font-bold tracking-wide border-b border-white/10 pb-2 mb-4 mt-8 flex items-center"><span class="w-2 h-2 rounded-full bg-cyan-500 mr-3"></span>$1</h4>').replace(/\*\*(.*?)\*\*/g, '<b class="text-cyan-200 font-semibold">$1</b>') }} />
               ) : (
                 <div className="animate-pulse flex flex-col space-y-6 mt-4">
                   <div className="h-6 bg-white/5 rounded w-1/3"></div>
                   <div className="space-y-3">
                     <div className="h-4 bg-white/5 rounded w-full"></div>
                     <div className="h-4 bg-white/5 rounded w-full"></div>
                     <div className="h-4 bg-white/5 rounded w-5/6"></div>
                   </div>
                   <div className="h-6 bg-white/5 rounded w-1/4 mt-8"></div>
                   <div className="space-y-3">
                     <div className="h-4 bg-white/5 rounded w-full"></div>
                     <div className="h-4 bg-white/5 rounded w-3/4"></div>
                   </div>
                 </div>
               )}
            </div>
         </div>
      </div>

    </motion.div>
  );
}

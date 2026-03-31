import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, ArrowRight, EyeOff, ShieldAlert, CheckCircle2, RefreshCw, Layers } from 'lucide-react';
import axios from 'axios';

export function DecisionReconstructionView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReconstruction = async () => {
      try {
        const [correctionRes, reconstructionRes] = await Promise.all([
          axios.get('/api/bias-correction'),
          axios.get('/api/reconstructed-decisions')
        ]);
        
        setData({
          correction: correctionRes.data,
          reconstruction: reconstructionRes.data
        });
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchReconstruction();
  }, []);

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-[60vh] space-y-4">
      <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
      <span className="text-cyan-200 tracking-widest text-sm uppercase font-mono">Sanitizing Identity Vectors...</span>
    </div>
  );

  if (!data) return <div className="text-center mt-20 font-mono tracking-widest text-xl text-secondary">SYSTEM NOT INITIALIZED.</div>;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="space-y-8">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/5 pb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2 text-white">Proxy Sanitization Engine</h2>
          <p className="text-secondary font-light">Neutralizing cultural proxies, scrubbing PII, and tracking decision deltas.</p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 border-l-4 border-l-blue-500">
              <div className="flex items-center space-x-3 mb-2">
                <EyeOff className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-gray-200">PII Blanket Masking</h3>
              </div>
              <p className="text-sm text-secondary font-mono mt-3">All applicant names randomized to sequential IDs. Zipcodes scrubbed to `[REDACTED]`.</p>
            </div>
            <div className="glass-panel p-6 border-l-4 border-l-cyan-500">
              <div className="flex items-center space-x-3 mb-2">
                <ShieldAlert className="w-5 h-5 text-cyan-400" />
                <h3 className="font-semibold text-gray-200">Semantic Extraction</h3>
              </div>
              <p className="text-sm text-secondary font-mono mt-3">Culturally biased markers translated autonomously to universally-recognized corporate competencies.</p>
            </div>
            <div className="glass-panel p-6 border-l-4 border-l-green-500">
              <div className="flex items-center space-x-3 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <h3 className="font-semibold text-gray-200">Fairness Metrics Locked</h3>
              </div>
              <p className="text-sm text-secondary font-mono mt-3">
                <span className="font-bold text-green-400 text-lg mr-2 sparkle-text">{data?.correction?.text_deltas?.length || 0}</span> 
                 resumes systematically neutralized.
              </p>
            </div>
          </div>

          <div className="glass-panel border border-white/10 overflow-hidden">
            <div className="bg-white/5 px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-mono tracking-widest uppercase text-gray-300 flex items-center">
                <Layers className="w-4 h-4 mr-3 text-cyan-400" /> 
                Before/After Raw Text Mapping
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-black/40 text-secondary font-mono text-xs tracking-wider border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4 w-32 font-medium text-purple-400 bg-purple-900/20 border-r border-purple-500/20">Candidate ID</th>
                    <th className="px-6 py-4 w-1/2 font-medium border-l border-white/5">Raw Input (Contains Proxy)</th>
                    <th className="px-4 py-4 w-12 text-center text-cyan-500/50 block">➔</th>
                    <th className="px-6 py-4 w-1/2 font-medium border-l border-white/5 text-cyan-400">Sanitized Output (Neutral)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-surface/50">
                  {(data?.correction?.text_deltas || []).slice(0, 15).map((delta, i) => {
                    const origParts = delta.full_original.split(delta.original_term);
                    const neutParts = delta.full_neutralized.split(delta.neutralized_term);
                    
                    return (
                      <tr key={i} className="hover:bg-cyan-900/10 transition-colors">
                        <td className="px-6 py-5 bg-purple-900/10 border-r border-purple-500/10 font-mono text-purple-300 font-bold text-xs">
                          {delta.candidate_id}
                        </td>
                        <td className="px-6 py-5 whitespace-normal border-l border-white/5">
                          <div className="bg-[#050505] text-gray-300 border border-red-500/30 shadow-[inset_0_0_10px_rgba(239,68,68,0.05)] rounded-md p-3 text-xs leading-relaxed">
                            {origParts.map((part, pIdx) => (
                              <React.Fragment key={pIdx}>
                                {part}
                                {pIdx < origParts.length - 1 && (
                                  <span className="font-bold text-red-500 underline decoration-red-500/60 decoration-2 underline-offset-4 mx-1">{delta.original_term}</span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </td>
                        <td className="px-2 py-5 text-center">
                        </td>
                        <td className="px-6 py-5 whitespace-normal border-l border-white/5">
                          <div className="bg-[#050505] text-gray-300 border border-cyan-500/30 shadow-[inset_0_0_10px_rgba(6,182,212,0.1)] rounded-md p-3 text-xs leading-relaxed">
                            {neutParts.map((part, pIdx) => (
                              <React.Fragment key={pIdx}>
                                {part}
                                {pIdx < neutParts.length - 1 && (
                                  <span className="font-bold text-cyan-400 underline decoration-cyan-400/60 decoration-2 underline-offset-4 mx-1">{delta.neutralized_term}</span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="px-6 py-3 border-t border-white/5 text-xs text-center text-secondary font-mono tracking-widest bg-black/50">
                DISPLAYING TOP 15 TRANSFORMATIONS
              </div>
            </div>
          </div>
        </motion.div>
    </motion.div>
  );
}

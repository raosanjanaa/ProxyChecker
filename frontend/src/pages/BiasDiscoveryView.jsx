import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { AlertTriangle, Activity, Database, CheckCircle, ArrowRight, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface/90 border border-border p-4 rounded-lg shadow-glass backdrop-blur-md">
        <p className="text-white font-semibold mb-1">{label}</p>
        <p className="text-sm font-mono" style={{ color: payload[0].fill }}>
          Selection Rate: {payload[0].value.toFixed(1)}%
        </p>
        {payload[0].payload.biased && (
          <p className="text-xs text-red-400 mt-2 font-medium">⚠️ Flagged: &lt;80% Disparate Impact</p>
        )}
      </div>
    );
  }
  return null;
};

export function BiasDiscoveryView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLocalization = async () => {
      try {
        const res = await axios.get('/api/bias-localization');
        setData(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchLocalization();
  }, []);

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-[60vh] space-y-4">
      <Zap className="w-8 h-8 text-cyan-400 animate-pulse-glow" />
      <span className="text-cyan-200 tracking-widest text-sm uppercase font-mono">Scanning Disparities...</span>
    </div>
  );

  if (!data || !data.disparate_impact) {
    return <div className="text-center mt-20 text-secondary font-mono tracking-widest text-xl">NO DATA MATRIX FOUND. INITIALIZE FIRST.</div>;
  }

  const chartData = data.disparate_impact.map(d => ({
    name: d.group,
    Rate: d.selection_rate * 100,
    impact: d.disparate_impact,
    biased: d.biased_against
  }));

  const biasedGroups = data.disparate_impact.filter(d => d.biased_against).map(d => d.group);

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-8">
      
      {/* Header */}
      <div className="flex justify-between items-end border-b border-border pb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2 text-white">Bias Localization Engine</h2>
          <p className="text-secondary font-light">Identifying disparate impacts and underlying algorithmic proxy leakage.</p>
        </div>
        <button 
          onClick={() => navigate('/reconstruction')}
          className="btn-primary group"
        >
          <span className="mr-3 font-semibold text-cyan-400 group-hover:text-white transition-colors">Initiate Sanitization</span>
          <ArrowRight className="w-4 h-4 text-cyan-500 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1 */}
        <div className="glass-panel p-6 border-l-4 border-l-purple-500 relative overflow-hidden group hover:shadow-neon-purple transition-all duration-500">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-300 tracking-wide text-sm uppercase">Identified Feature Proxy</h3>
            <AlertTriangle className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-2 leading-tight">
            {data.correlations.find(c => c.is_sensitive)?.feature || "Multiple Detected"}
          </p>
          <p className="text-xs mt-3 text-secondary font-mono flex items-center">
            Correlation Matrix Alert: 
            <span className="text-purple-300 ml-2 font-bold bg-purple-900/30 px-2 py-0.5 rounded border border-purple-500/30">
              Risk Found
            </span>
          </p>
        </div>
        
        {/* Card 2 */}
        <div className="glass-panel p-6 border-l-4 border-l-red-500 relative overflow-hidden group hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all duration-500">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all"></div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-300 tracking-wide text-sm uppercase">Marginalized Cohorts</h3>
            <Activity className="w-5 h-5 text-red-400" />
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {biasedGroups.map((group, i) => (
              <span key={i} className="px-3 py-1 bg-red-950/50 text-red-300 border border-red-500/30 rounded text-sm font-semibold tracking-wide">
                {group}
              </span>
            ))}
          </div>
          <p className="text-xs mt-4 text-secondary font-mono">Cohorts failing 80% impact rule.</p>
        </div>

        {/* Card 3 */}
        <div className="glass-panel p-6 border-l-4 border-l-cyan-500 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl"></div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-300 tracking-wide text-sm uppercase">System Status</h3>
            <CheckCircle className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="space-y-3 mt-4">
            <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
              <span className="text-secondary">Disparate Extraction</span>
              <span className="font-mono text-cyan-400 bg-cyan-900/40 px-2 py-1 rounded text-xs">COMPLETE</span>
            </div>
            <div className="flex justify-between items-center text-sm mt-2">
              <span className="text-secondary">Proxy Network Analysis</span>
              <span className="font-mono text-cyan-400 bg-cyan-900/40 px-2 py-1 rounded text-xs">COMPLETE</span>
            </div>
          </div>
        </div>

      </div>

      {/* Main Analysis Chart */}
      <div className="glass-panel p-8 mt-6">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-semibold flex items-center text-white">
            <Database className="w-5 h-5 mr-3 text-cyan-500" /> 
            Algorithmic Selection Variance by Identity Group
          </h3>
          <span className="text-xs font-mono text-secondary px-3 py-1 bg-white/5 border border-white/10 rounded-full">REAL-TIME TELEMETRY</span>
        </div>
        
        <div className="h-80 w-full mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12, fontFamily: 'monospace'}} dy={10} />
              <YAxis unit="%" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dx={-10} />
              <Tooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} content={<CustomTooltip />} />
              <Bar dataKey="Rate" radius={[4, 4, 0, 0]} maxBarSize={50} animationDuration={1500}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.biased ? '#EF4444' : '#06b6d4'} className="transition-all duration-300" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-5 flex space-x-4 items-start mt-6 backdrop-blur-sm">
           <div className="bg-red-950 p-2 border border-red-500/40 rounded-lg shadow-[0_0_10px_rgba(239,68,68,0.2)] mt-0.5">
             <AlertTriangle size={18} className="text-red-400" />
           </div>
           <p className="text-red-200/80 leading-relaxed text-sm">
             The engine has isolated <span className="font-bold text-red-400 sparkle-text">{biasedGroups.join(', ')}</span> 
             as facing disproportionate rejection. Proxies in their profiles are acting redundantly with protected demographic status, mathematically causing the disparate impact logged above.
           </p>
        </div>
      </div>
    </motion.div>
  );
}

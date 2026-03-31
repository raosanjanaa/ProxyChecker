import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, AlertCircle, Database, Sparkles } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';

export function UploadView() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile);
    } else {
      setError("Please upload a valid CSV data archive.");
    }
  };

  const handleProcess = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await axios.post('/api/upload', formData);
      navigate('/discovery', { state: { understanding: res.data.understanding } });
    } catch (err) {
      setError(err.response?.data?.detail || "System fault during initialization.");
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="max-w-3xl mx-auto mt-16"
    >
      <div className="mb-10 text-center relative">
        <div className="inline-flex items-center justify-center px-3 py-1 mb-6 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-mono tracking-widest uppercase shadow-[0_0_10px_rgba(6,182,212,0.2)]">
          <Sparkles className="w-3 h-3 mr-2" />
          Autonomous Auditing Enabled
        </div>
        <h2 className="text-4xl font-bold mb-4 tracking-tight text-white leading-tight">
          System Initialization <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 font-bold tracking-tight">Awaiting Data Core</span>
        </h2>
        <p className="text-secondary text-lg max-w-xl mx-auto font-light">
          Upload decision history (CSV) to engage the ProxyShield anomaly detection framework.
        </p>
      </div>

      <div 
        className={`glass-panel p-16 flex flex-col items-center justify-center border-2 border-dashed transition-all duration-300 ${file ? 'border-cyan-500/50 bg-cyan-900/10 shadow-neon' : 'border-border hover:border-cyan-500/30 hover:bg-white/5'}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <div className={`p-5 rounded-full mb-6 shadow-glass relative ${file ? 'bg-cyan-500/20 text-cyan-400' : 'bg-surface border border-border text-secondary'}`}>
          <Database className={`w-10 h-10 ${file ? 'animate-pulse' : ''}`} />
          {loading && <div className="absolute inset-0 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>}
        </div>
        
        {file ? (
          <div className="flex flex-col items-center">
            <div className="flex items-center space-x-3 text-white font-medium mb-8">
              <FileText className="w-5 h-5 text-cyan-400" />
              <span className="font-mono text-lg">{file.name}</span>
            </div>
            <button 
              className="btn-accent w-56 py-3 text-sm tracking-wide uppercase font-bold"
              onClick={handleProcess}
              disabled={loading}
            >
              {loading ? "Engaging Engine..." : "Run Analysis"}
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-xl font-semibold text-white mb-2">Drag and drop dataset matrix</p>
            <p className="text-sm text-secondary mb-8">Strictly supporting .CSV formatting</p>
            <label className="btn-primary cursor-pointer border-cyan-500/20 text-cyan-300 hover:text-cyan-100 hover:border-cyan-500 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              Browse Files
              <input type="file" accept=".csv" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
            </label>
          </div>
        )}
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 flex items-center space-x-3 text-red-400 bg-red-950/40 p-5 rounded-xl border border-red-500/30 shadow-glass">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </motion.div>
      )}
    </motion.div>
  );
}

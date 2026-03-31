import React, { useMemo } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { UploadView } from './pages/UploadView';
import { BiasDiscoveryView } from './pages/BiasDiscoveryView';
import { BiasCorrectionView } from './pages/BiasCorrectionView';
import { DecisionReconstructionView } from './pages/DecisionReconstructionView';

function App() {
  const linkClass = ({ isActive }) => 
    `text-sm font-medium transition-colors duration-300 relative px-2 py-1 ${
      isActive 
        ? "text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 font-bold" 
        : "text-gray-400 hover:text-white"
    }`;

  const particles = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      size: Math.random() * 4 + 1,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 10 + 10,
      delay: Math.random() * 5,
      isCyan: Math.random() > 0.5
    }));
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col font-sans selection:bg-cyan-500/30" style={{ backgroundColor: '#050505', color: '#F9FAFB', backgroundImage: 'radial-gradient(circle at 15% 50%, rgba(6, 182, 212, 0.05), transparent 25%), radial-gradient(circle at 85% 30%, rgba(168, 85, 247, 0.05), transparent 25%)' }}>
        
        {/* Navbar */}
        <header className="bg-[#121212]/90 backdrop-blur-xl border-b border-white/10 py-4 px-8 flex justify-between items-center z-50 sticky top-0 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 text-white flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)] group-hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all duration-500">
              <Shield className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 uppercase drop-shadow-[0_2px_10px_rgba(6,182,212,0.5)]">ProxyShield</h1>
          </div>
          
          <nav className="flex space-x-8">
            <NavLink to="/" className={linkClass}>Audit Init</NavLink>
            <NavLink to="/discovery" className={linkClass}>Bias Localization</NavLink>
            <NavLink to="/reconstruction" className={linkClass}>Proxy Sanitization</NavLink>
            <NavLink to="/correction" className={linkClass}>Correction Engine</NavLink>
          </nav>
        </header>

        {/* Dynamic Background Effects */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
           <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-900/10 blur-[120px]"></div>
           <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-900/10 blur-[120px]"></div>
           {particles.map(p => (
             <div 
               key={p.id}
               className={`site-sparkle ${p.isCyan ? 'text-cyan-400 bg-cyan-400' : 'text-purple-400 bg-purple-400'}`}
               style={{
                 left: `${p.x}vw`, 
                 width: `${p.size * 1.5}px`, 
                 height: `${p.size * 1.5}px`,
                 animationDuration: `${p.duration * 2}s`,
                 animationDelay: `-${p.delay * 10}s`
               }}
             />
           ))}
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto w-full max-w-[1400px] mx-auto p-8 z-10 relative">
          <Routes>
            <Route path="/" element={<UploadView />} />
            <Route path="/discovery" element={<BiasDiscoveryView />} />
            <Route path="/reconstruction" element={<DecisionReconstructionView />} />
            <Route path="/correction" element={<BiasCorrectionView />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;

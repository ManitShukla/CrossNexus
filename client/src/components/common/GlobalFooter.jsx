import React from 'react';
import { Github, ExternalLink, Terminal } from 'lucide-react';

export default function GlobalFooter({ className = '' }) {
  return (
    <footer className={`w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 mt-auto relative z-10 ${className}`}>
      <div className="fui-panel border border-stroke-dim hover:border-stroke-bright bg-charcoal-panel p-4 sm:p-5 relative transition-all">
        {/* CORNER RETICLES */}
        <div className="fui-reticle-tl" />
        <div className="fui-reticle-tr" />
        <div className="fui-reticle-bl" />
        <div className="fui-reticle-br" />

        <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-2 text-phosphor font-bold uppercase tracking-ui">
              <Terminal className="w-4 h-4 text-phosphor flex-shrink-0" />
              <span>MADE BY <span className="text-tactical-bright">MANIT SHUKLA</span></span>
            </span>
            <span className="text-stroke-bright hidden sm:inline">|</span>
            <span className="text-teal font-medium text-[11px] hidden sm:inline">
              ECE &bull; 2026UEC2604
            </span>
            <span className="text-stroke-bright hidden md:inline">|</span>
            <span className="text-tactical-muted text-[11px] hidden md:inline">
              NETAJI SUBHAS UNIVERSITY OF TECHNOLOGY
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/ManitShukla/CrossNexus"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 border border-phosphor/60 hover:border-phosphor bg-black hover:bg-phosphor hover:text-black text-phosphor transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-label group cursor-pointer"
            >
              <Github className="w-3.5 h-3.5 group-hover:scale-110 transition-transform flex-shrink-0" />
              <span>&lt;GITHUB REPOSITORY&gt;</span>
              <ExternalLink className="w-3 h-3 text-phosphor group-hover:text-black transition-colors flex-shrink-0" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

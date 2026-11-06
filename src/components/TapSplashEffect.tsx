import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Droplet } from 'lucide-react';

interface TapSplashEffectProps {
  splash: {
    id: number;
    volume: number;
    person?: string;
  } | null;
}

export const TapSplashEffect: React.FC<TapSplashEffectProps> = ({ splash }) => {
  return (
    <AnimatePresence>
      {splash && (
        <motion.div
          key={splash.id}
          initial={{ opacity: 0, y: 20, scale: 0.7 }}
          animate={{ opacity: 1, y: -45, scale: 1.05 }}
          exit={{ opacity: 0, y: -80, scale: 0.9 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none absolute left-1/2 -top-8 z-30 -translate-x-1/2 flex items-center gap-1.5 rounded-full border border-sky-300/40 bg-gradient-to-r from-sky-500 via-sky-400 to-blue-500 px-4 py-1.5 text-xs font-black text-white shadow-xl shadow-sky-500/50 backdrop-blur-md"
        >
          <Droplet className="h-4 w-4 fill-white" />
          <span>+{splash.volume}L</span>
          {splash.person && (
            <span className="rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-bold text-sky-100">
              by {splash.person}
            </span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};


import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const emojis = ['🐶', '🐱', '🐰', '🦜', '🐢'];

interface EmojiSwitcherProps {
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
}

export const EmojiSwitcher: React.FC<EmojiSwitcherProps> = ({ onClick, className, children, disabled }) => {
  const [index, setIndex] = useState(0);

  const cycleEmoji = (e: React.MouseEvent) => {
    if (disabled) return;
    setIndex((prevIndex) => (prevIndex + 1) % emojis.length);
    if (onClick) onClick();
  };

  return (
    <button
      onClick={cycleEmoji}
      disabled={disabled}
      className={`relative flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300 overflow-hidden shadow-lg group ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className || 'w-16 h-16'}`}
      aria-label="Switch animal emoji"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={emojis[index]}
          initial={{ y: 20, opacity: 0, scale: 0.5 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -20, opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 20 }}
          className="emoji-container text-3xl select-none mr-2"
        >
          {emojis[index]}
        </motion.div>
      </AnimatePresence>
      
      {children}
      
      {/* Subtle hover effect / glow */}
      <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full blur-xl pointer-events-none" />
    </button>
  );
};

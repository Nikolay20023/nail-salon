import { motion } from 'framer-motion';
import { CSSProperties } from 'react';

interface AnimatedStickerProps {
  emoji?: string;
  animationType?: 'wave' | 'bounce' | 'spin' | 'pulse';
  size?: number;
  style?: CSSProperties;
}

const animations = {
  wave: {
    rotate: [0, -15, 15, -15, 15, 0],
    transition: { duration: 1.5, repeat: Infinity }
  },
  bounce: {
    y: [0, -30, 0],
    transition: { duration: 1, repeat: Infinity, ease: "easeInOut" }
  },
  spin: {
    rotate: 360,
    transition: { duration: 2, repeat: Infinity, ease: "linear" }
  },
  pulse: {
    scale: [1, 1.2, 1],
    transition: { duration: 1, repeat: Infinity }
  }
};

export function AnimatedSticker({ 
  emoji = '🦆', 
  animationType = 'wave',
  size = 64,
  style 
}: AnimatedStickerProps) {
  return (
    <motion.div
      style={{
        fontSize: size,
        display: 'inline-block',
        ...style
      }}
      {...animations[animationType]}
    >
      {emoji}
    </motion.div>
  );
}
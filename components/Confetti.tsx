'use client';

/**
 * Конфетти эффект для празднования победы
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  delay: number;
}

const COLORS = ['#FF006E', '#3A86FF', '#8338EC', '#FB5607', '#FFBE0B', '#06D6A0', '#FFD60A'];

export function Confetti() {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    const newPieces: ConfettiPiece[] = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 20,
      rotation: Math.random() * 360,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 0.5,
    }));
    setPieces(newPieces);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50" aria-hidden="true">
      {pieces.map((piece) => (
        <motion.div
          key={piece.id}
          className="absolute w-3 h-3 rounded-sm"
          style={{
            left: `${piece.x}%`,
            backgroundColor: piece.color,
          }}
          initial={{
            y: -20,
            x: `${piece.x}%`,
            rotate: 0,
          }}
          animate={{
            y: '110vh',
            rotate: piece.rotation + 720,
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            delay: piece.delay,
            ease: 'linear',
            repeat: Infinity,
            repeatDelay: 1,
          }}
        />
      ))}
    </div>
  );
}

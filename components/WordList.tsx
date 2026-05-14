/**
 * Компонент списка слов
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface WordListProps {
  words: string[];
  foundWords: Set<string>;
  title?: string;
}

export function WordList({ words, foundWords, title = 'Найти слова:' }: WordListProps) {
  const sortedWords = [...words].sort();

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl p-5 border border-white/20">
      <h3 className="text-xl font-black mb-4 text-white flex items-center gap-2">
        📝 {title}
      </h3>
      <div className="flex flex-wrap gap-2">
        {sortedWords.map((word, index) => {
          const isFound = foundWords.has(word);
          
          return (
            <motion.div
              key={word}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ 
                opacity: isFound ? 0.5 : 1,
                scale: isFound ? 0.9 : 1,
                y: 0,
              }}
              transition={{
                duration: 0.3,
                delay: index * 0.03,
              }}
              className={`
                px-4 py-2 rounded-lg text-center font-bold text-sm whitespace-nowrap
                transition-all duration-300
                ${isFound 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30' 
                  : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
                }
              `}
              role="listitem"
              aria-label={`${word} ${isFound ? 'найдено' : 'не найдено'}`}
            >
              {word}
            </motion.div>
          );
        })}
      </div>
      
      <div className="mt-5 pt-4 border-t border-white/20">
        <div className="flex items-center justify-between text-white/80 text-sm mb-2">
          <span>Прогресс:</span>
          <span className="font-black text-cyan-300">
            {foundWords.size} / {words.length}
          </span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
          <motion.div
            className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 h-full rounded-full shadow-lg shadow-emerald-400/50"
            initial={{ width: 0 }}
            animate={{ width: `${(foundWords.size / words.length) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        {foundWords.size === words.length && (
          <motion.div
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="mt-3 text-center text-amber-300 font-bold"
          >
            🎉 Все слова найдены!
          </motion.div>
        )}
      </div>
    </div>
  );
}

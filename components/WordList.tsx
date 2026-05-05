/**
 * Компонент списка слов
 */

'use client';

import React from 'react';

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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {sortedWords.map((word) => {
          const isFound = foundWords.has(word);
          
          return (
            <div
              key={word}
              className={`
                px-3 py-3 rounded-xl text-center font-bold text-sm md:text-lg
                transition-all duration-300 transform break-words
                min-h-[3.5rem] flex items-center justify-center
                ${isFound 
                  ? 'bg-gradient-to-br from-emerald-500/80 to-teal-500/80 text-white scale-95 shadow-lg shadow-emerald-500/30' 
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:scale-105'
                }
              `}
            >
              <span className="break-words leading-tight">{word}</span>
            </div>
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
          <div 
            className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 h-full rounded-full transition-all duration-500 shadow-lg shadow-emerald-400/50"
            style={{ width: `${(foundWords.size / words.length) * 100}%` }}
          />
        </div>
        {foundWords.size === words.length && (
          <div className="mt-3 text-center text-amber-300 font-bold animate-pulse">
            🎉 Все слова найдены!
          </div>
        )}
      </div>
    </div>
  );
}

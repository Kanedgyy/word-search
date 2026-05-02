/**
 * Компонент списка слов
 * 
 * Отображает список слов, которые нужно найти
 */

'use client';

import React from 'react';

interface WordListProps {
  words: string[];
  foundWords: Set<string>;
  title?: string;
}

export function WordList({ words, foundWords, title = 'Найти слова:' }: WordListProps) {
  // Сортируем слова по алфавиту
  const sortedWords = [...words].sort();

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h3 className="text-lg font-bold mb-3 text-gray-800">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {sortedWords.map((word) => {
          const isFound = foundWords.has(word);
          
          return (
            <div
              key={word}
              className={`
                px-3 py-2 rounded-lg text-center font-medium
                transition-all duration-200
                ${isFound 
                  ? 'bg-green-100 text-green-700 line-through' 
                  : 'bg-gray-100 text-gray-700'
                }
              `}
            >
              {word}
            </div>
          );
        })}
      </div>
      
      {/* Статистика */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          Найдено: <span className="font-bold text-green-600">{foundWords.size}</span> из{' '}
          <span className="font-bold">{words.length}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(foundWords.size / words.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

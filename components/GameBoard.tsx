/**
 * Компонент игрового поля
 * 
 * Отображает сетку 10×10 с буквами.
 * Игрок выделяет слово, ведя мышью по соседним клеткам (змейка).
 */

'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

// Типы
type Grid = string[][];

interface Coordinate {
  row: number;
  col: number;
}

interface GameBoardProps {
  grid: Grid;
  foundWords: Set<string>;
  playerColor?: string;
  onWordSelect?: (word: string, path: Array<{ row: number; col: number }>, direction: 'horizontal' | 'vertical' | 'diagonal_down' | 'diagonal_up') => void;
  foundCellsMap?: Record<string, string>;
  isGameActive?: boolean; // ✅ Новый пропс
}

export function GameBoard({ 
  grid, 
  foundWords, 
  playerColor = '#FF006E',
  onWordSelect,
  foundCellsMap = {},
  isGameActive = true // ✅ По умолчанию активна
}: GameBoardProps) {
  const [selectedPath, setSelectedPath] = useState<Coordinate[]>([]);
  const [isMouseDown, setIsMouseDown] = useState(false);

  // Проверяет, что клетки соседние по стороне
  const isNeighbor = (a: Coordinate, b: Coordinate): boolean => {
    const dr = Math.abs(a.row - b.row);
    const dc = Math.abs(a.col - b.col);
    return dr + dc === 1;
  };

  const isInPath = (row: number, col: number): boolean => {
    return selectedPath.some(p => p.row === row && p.col === col);
  };

  const getFoundCellColor = (row: number, col: number): string | null => {
    const key = `${row}-${col}`;
    return foundCellsMap[key] || null;
  };

  const handleMouseDown = (row: number, col: number) => {
    if (!isGameActive) return; // ✅ Блокировка если игра не активна

    const clicked: Coordinate = { row, col };
    const existingIndex = selectedPath.findIndex(p => p.row === row && p.col === col);

    if (existingIndex !== -1) {
      setSelectedPath(selectedPath.slice(0, existingIndex + 1));
    } else if (selectedPath.length === 0) {
      setSelectedPath([clicked]);
    } else if (isNeighbor(selectedPath[selectedPath.length - 1], clicked)) {
      setSelectedPath([...selectedPath, clicked]);
    } else {
      setSelectedPath([clicked]);
    }
    setIsMouseDown(true);
  };

  const handleMouseEnter = (row: number, col: number) => {
    if (!isGameActive) return; // ✅ Блокировка если игра не активна
    if (!isMouseDown || selectedPath.length === 0) return;

    const last = selectedPath[selectedPath.length - 1];
    const current: Coordinate = { row, col };

    if (selectedPath.length >= 2) {
      const prev = selectedPath[selectedPath.length - 2];
      if (prev.row === row && prev.col === col) {
        setSelectedPath(selectedPath.slice(0, -1));
        return;
      }
    }

    if (isInPath(row, col)) return;

    if (isNeighbor(last, current)) {
      setSelectedPath([...selectedPath, current]);
    }
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
    if (!isGameActive) return; // ✅ Блокировка если игра не активна
    
    if (selectedPath.length >= 3 && onWordSelect) {
      const word = selectedPath.map(p => grid[p.row][p.col]).join('');
      const start = selectedPath[0];
      const end = selectedPath[selectedPath.length - 1];
      
      // Вычисляем направление по start и end
      const dr = end.row - start.row;
      const dc = end.col - start.col;
      let direction: 'horizontal' | 'vertical' | 'diagonal_down' | 'diagonal_up' = 'horizontal';
      
      if (dr === 0 && dc !== 0) {
        direction = 'horizontal';
      } else if (dc === 0 && dr !== 0) {
        direction = 'vertical';
      } else if (Math.abs(dr) === Math.abs(dc) && dr !== 0) {
        direction = dr > 0 ? 'diagonal_down' : 'diagonal_up';
      }
      
      onWordSelect(word, selectedPath, direction);
    }
    setSelectedPath([]);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedPath([]);
    setIsMouseDown(false);
  };

  const getCellBackgroundColor = (row: number, col: number, letterInPath: boolean): string => {
    const foundColor = getFoundCellColor(row, col);
    if (foundColor) {
      return foundColor;
    }
    if (letterInPath) {
      return playerColor;
    }
    return 'rgba(255, 255, 255, 0.15)';
  };

  return (
    <div 
      className={`inline-block bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-6 select-none border border-white/20 ${
        !isGameActive ? 'opacity-50' : ''
      }`}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={handleContextMenu}
      style={{
        // Полностью отключаем взаимодействие когда игра не активна
        pointerEvents: !isGameActive ? 'none' : 'auto',
      }}
    >
      <div 
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${grid.length}, 1fr)` }}
      >
        {grid.map((row, rowIndex) => (
          row.map((letter, colIndex) => {
            const inPath = isInPath(rowIndex, colIndex);
            const foundColor = getFoundCellColor(rowIndex, colIndex);
            const bgColor = getCellBackgroundColor(rowIndex, colIndex, inPath);
            
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                className={`
                  w-12 h-12 md:w-14 md:h-14 flex items-center justify-center 
                  text-xl md:text-2xl rounded-xl cursor-pointer 
                  transition-all duration-200
                  ${inPath 
                    ? 'text-white font-black ring-4 ring-white/30' 
                    : 'text-gray-900 font-bold'
                  }
                  ${foundColor ? 'text-white font-black ring-2 ring-white/50' : ''}
                `}
                style={{ 
                  backgroundColor: bgColor,
                  boxShadow: inPath || foundColor ? `0 0 20px ${inPath ? playerColor : foundColor}88` : 'none',
                  // ✅ Убираем hover эффекты для производительности
                  transform: 'none !important',
                }}
              >
                {letter}
              </div>
            );
          })
        ))}
      </div>
      <div className="mt-4 text-center text-sm text-white/70 font-medium">
        Выделено букв: <span className="text-white font-bold">{selectedPath.length}</span>
        {selectedPath.length >= 3 && (
          <span className="ml-3 text-white font-black text-lg">
            → {selectedPath.map(p => grid[p.row][p.col]).join('')}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Компонент игрового поля
 * 
 * Отображает сетку 10×10 с буквами.
 * Игрок выделяет слово, ведя мышью по соседним клеткам (змейка).
 */

'use client';

import React, { useState, useCallback } from 'react';

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
  onWordSelect?: (word: string, path: Coordinate[]) => void;
  lastFoundWord?: string | null;
  lastFoundWordColor?: string;
}

export function GameBoard({ 
  grid, 
  foundWords, 
  playerColor = '#FF006E',
  onWordSelect,
  lastFoundWord = null,
  lastFoundWordColor = '#FF006E'
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

  const getFoundWordColor = (row: number, col: number): string | null => {
    // Проверяем, входит ли клетка в последнее найденное слово
    if (lastFoundWord) {
      // Мы не знаем путь последнего слова, поэтому подсвечиваем все буквы
      // которые есть в последнем найденном слове
      return lastFoundWordColor;
    }
    return null;
  };

  const handleMouseDown = (row: number, col: number) => {
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
    if (selectedPath.length >= 3 && onWordSelect) {
      const word = selectedPath.map(p => grid[p.row][p.col]).join('');
      onWordSelect(word, selectedPath);
    }
    setSelectedPath([]);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedPath([]);
    setIsMouseDown(false);
  };

  // Яркие цвета для игроков
  const getCellBackgroundColor = (row: number, col: number, letterInPath: boolean): string => {
    const foundColor = getFoundWordColor(row, col);
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
      className="inline-block bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-6 select-none border border-white/20"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={handleContextMenu}
    >
      <div 
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${grid.length}, 1fr)` }}
      >
        {grid.map((row, rowIndex) => (
          row.map((letter, colIndex) => {
            const inPath = isInPath(rowIndex, colIndex);
            const foundColor = getFoundWordColor(rowIndex, colIndex);
            const bgColor = getCellBackgroundColor(rowIndex, colIndex, inPath);
            
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                className={`
                  w-12 h-12 md:w-14 md:h-14 flex items-center justify-center 
                  text-xl md:text-2xl font-black rounded-xl cursor-pointer 
                  transition-all duration-200 transform
                  ${inPath 
                    ? 'text-white scale-110 shadow-xl ring-4 ring-white/30' 
                    : 'hover:scale-105'
                  }
                  ${foundColor ? 'text-white ring-2 ring-white/50' : 'text-gray-900 font-bold'}
                `}
                style={{ 
                  backgroundColor: bgColor,
                  boxShadow: inPath || foundColor ? `0 0 20px ${inPath ? playerColor : foundColor}88` : 'none'
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

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
}

export function GameBoard({ 
  grid, 
  foundWords, 
  playerColor = '#4ECDC4',
  onWordSelect 
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

  const handleMouseDown = (row: number, col: number) => {
    const clicked: Coordinate = { row, col };
    const existingIndex = selectedPath.findIndex(p => p.row === row && p.col === col);

    if (existingIndex !== -1) {
      // Кликнули на клетку внутри пути — обрезаем до неё
      setSelectedPath(selectedPath.slice(0, existingIndex + 1));
    } else if (selectedPath.length === 0) {
      // Начинаем новый путь
      setSelectedPath([clicked]);
    } else if (isNeighbor(selectedPath[selectedPath.length - 1], clicked)) {
      // Добавляем соседнюю клетку
      setSelectedPath([...selectedPath, clicked]);
    } else {
      // Начинаем новый путь
      setSelectedPath([clicked]);
    }
    setIsMouseDown(true);
  };

  const handleMouseEnter = (row: number, col: number) => {
    if (!isMouseDown || selectedPath.length === 0) return;

    const last = selectedPath[selectedPath.length - 1];
    const current: Coordinate = { row, col };

    // Если вернулись на предыдущую клетку — убираем последнюю
    if (selectedPath.length >= 2) {
      const prev = selectedPath[selectedPath.length - 2];
      if (prev.row === row && prev.col === col) {
        setSelectedPath(selectedPath.slice(0, -1));
        return;
      }
    }

    // Если уже в пути — игнорируем
    if (isInPath(row, col)) return;

    // Если соседняя — добавляем
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

  return (
    <div 
      className="inline-block bg-white rounded-lg shadow-lg p-4 select-none"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={handleContextMenu}
    >
      <div 
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${grid.length}, 1fr)` }}
      >
        {grid.map((row, rowIndex) => (
          row.map((letter, colIndex) => {
            const inPath = isInPath(rowIndex, colIndex);
            const pathIndex = selectedPath.findIndex(p => p.row === rowIndex && p.col === colIndex);
            
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                className={`
                  w-10 h-10 flex items-center justify-center 
                  text-lg font-bold rounded cursor-pointer 
                  transition-all duration-100
                  ${inPath 
                    ? 'text-white scale-110 shadow-md' 
                    : 'bg-gray-100 hover:bg-gray-200'
                  }
                `}
                style={inPath ? { 
                  backgroundColor: playerColor,
                  opacity: 0.7 + (pathIndex / selectedPath.length) * 0.3
                } : {}}
              >
                {letter}
              </div>
            );
          })
        ))}
      </div>
      <div className="mt-2 text-center text-sm text-gray-500">
        Выделено букв: {selectedPath.length}
        {selectedPath.length >= 3 && (
          <span className="ml-2 font-medium text-gray-700">
            → {selectedPath.map(p => grid[p.row][p.col]).join('')}
          </span>
        )}
      </div>
    </div>
  );
}

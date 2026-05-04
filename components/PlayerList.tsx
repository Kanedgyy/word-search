/**
 * Компонент списка игроков
 * 
 * Отображает всех игроков в сессии с их очками
 */

'use client';

import React from 'react';

interface Player {
  id: string;
  name: string;
  color: string;
  wordsFound: number;
  isBot: boolean;
  rank?: number;
  team?: string | null;
}

interface PlayerListProps {
  players: Player[];
  currentPlayerId?: string;
  title?: string;
  showTeams?: boolean;
  isHost?: boolean;
  onSetTeam?: (playerId: string, team: string) => void;
  onRemovePlayer?: (playerId: string) => void;
  status?: 'waiting' | 'in_progress' | 'finished' | undefined;
  gameMode?: 'individual' | 'team' | undefined;
}

const TEAM_COLORS: Record<string, string> = {
  red: 'bg-red-100 text-red-700 border-red-300',
  blue: 'bg-blue-100 text-blue-700 border-blue-300',
  green: 'bg-green-100 text-green-700 border-green-300',
  yellow: 'bg-yellow-100 text-yellow-700 border-yellow-300',
};

const TEAM_NAMES: Record<string, string> = {
  red: '🔴',
  blue: '🔵',
  green: '🟢',
  yellow: '🟡',
};

export function PlayerList({ players, currentPlayerId, title = 'Игроки:', showTeams = false, isHost = false, onSetTeam, onRemovePlayer, status, gameMode }: PlayerListProps) {
  // Сортируем игроков по количеству слов
  const sortedPlayers = [...players].sort((a, b) => b.wordsFound - a.wordsFound);

  const teamOptions = [
    { id: 'red', label: '🔴', color: 'bg-red-500' },
    { id: 'blue', label: '🔵', color: 'bg-blue-500' },
    { id: 'green', label: '🟢', color: 'bg-green-500' },
    { id: 'yellow', label: '🟡', color: 'bg-yellow-500' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h3 className="text-lg font-bold mb-3 text-gray-800">{title}</h3>
      <div className="space-y-2">
        {sortedPlayers.map((player) => {
          const isCurrentPlayer = player.id === currentPlayerId;
          
          return (
            <div
              key={player.id}
              className={`
                flex items-center justify-between p-3 rounded-lg
                ${isCurrentPlayer ? 'ring-2 ring-blue-400' : ''}
              `}
              style={{ 
                backgroundColor: isCurrentPlayer ? '#EFF6FF' : '#F9FAFB',
                borderLeft: `4px solid ${player.color}`
              }}
            >
              <div className="flex items-center gap-3 flex-1">
                {/* Индикатор ранга */}
                {player.rank && (
                  <div className="w-6 h-6 flex items-center justify-center rounded-full bg-yellow-400 text-white text-sm font-bold">
                    {player.rank}
                  </div>
                )}
                
                {/* Аватар с первой буквой */}
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: player.color }}
                >
                  {player.name.charAt(0).toUpperCase()}
                </div>
                
                {/* Имя и статус */}
                <div className="flex-1">
                  <div className="font-medium text-gray-800">
                    {player.name}
                    {player.isBot && (
                      <span className="ml-1 text-xs text-gray-500">(бот)</span>
                    )}
                    {isCurrentPlayer && (
                      <span className="ml-1 text-xs text-blue-500">(вы)</span>
                    )}
                  </div>
                  {showTeams && player.team && (
                    <span className={`inline-block px-2 py-0.5 rounded text-xs border ${TEAM_COLORS[player.team] || 'bg-gray-100'}`}>
                      {TEAM_NAMES[player.team] || player.team} Команда
                    </span>
                  )}
                  {/* Хост может менять команду бота */}
                  {showTeams && isHost && player.isBot && onSetTeam && (
                    <div className="flex gap-1 mt-1">
                      {teamOptions.map(t => (
                        <button
                          key={t.id}
                          onClick={() => onSetTeam(player.id, t.id)}
                          className={`w-6 h-6 rounded-full ${t.color} text-white text-xs flex items-center justify-center hover:opacity-80 transition-opacity ${
                            player.team === t.id ? 'ring-2 ring-offset-1 ring-gray-400' : 'opacity-60'
                          }`}
                          title={`Команда ${t.id}`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
                {/* Счёт и кнопки */}
              <div className="flex items-center gap-3">
                <div className="text-xl font-bold text-gray-800">
                  {player.wordsFound}
                </div>
                
                {/* Кнопка удаления (только для хоста, не для себя, и только до начала игры) */}
                {isHost && !isCurrentPlayer && onRemovePlayer && status === 'waiting' && (
                  <button
                    onClick={() => {
                      if (confirm(`Удалить ${player.name}?`)) {
                        onRemovePlayer(player.id);
                      }
                    }}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-all"
                    title="Удалить игрока"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

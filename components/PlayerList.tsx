/**
 * Компонент списка игроков
 */

'use client';

import React from 'react';

interface Player {
  id: string;
  name: string;
  color: string;
  wordsFound: number;
  isBot: boolean;
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
}

export function PlayerList({ players, currentPlayerId, title = 'Игроки:', showTeams = false, isHost = false, onSetTeam, onRemovePlayer, status }: PlayerListProps) {
  const sortedPlayers = [...players].sort((a, b) => b.wordsFound - a.wordsFound);

  const teamOptions = [
    { id: 'red', label: '🔴', color: 'bg-red-500' },
    { id: 'blue', label: '🔵', color: 'bg-blue-500' },
    { id: 'green', label: '🟢', color: 'bg-green-500' },
    { id: 'yellow', label: '🟡', color: 'bg-yellow-500' },
  ];

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl p-5 border border-white/20">
      <h3 className="text-xl font-black mb-4 text-white flex items-center gap-2">
        👥 {title}
      </h3>
      <div className="space-y-3">
        {sortedPlayers.map((player) => {
          const isCurrentPlayer = player.id === currentPlayerId;
          
          return (
            <div
              key={player.id}
              className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                isCurrentPlayer ? 'ring-2 ring-cyan-400 scale-105' : 'hover:bg-white/5'
              }`}
              style={{ 
                backgroundColor: isCurrentPlayer ? 'rgba(34, 211, 238, 0.15)' : 'transparent',
                border: `2px solid ${player.color}44`
              }}
            >
              <div className="flex items-center gap-3 flex-1">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-lg shadow-lg"
                  style={{ backgroundColor: player.color, boxShadow: `0 4px 15px ${player.color}66` }}
                >
                  {player.name.charAt(0).toUpperCase()}
                </div>
                
                <div className="flex-1">
                  <div className="font-bold text-white flex items-center gap-2">
                    {player.name}
                    {player.isBot && <span className="text-xs bg-white/20 px-2 py-0.5 rounded">🤖</span>}
                    {isCurrentPlayer && <span className="text-xs bg-cyan-500/80 px-2 py-0.5 rounded">вы</span>}
                  </div>
                  {showTeams && player.team && (
                    <span className="text-xs text-white/60 mt-1 block">
                      {player.team === 'red' && '🔴 Красная'}
                      {player.team === 'blue' && '🔵 Синяя'}
                      {player.team === 'green' && '🟢 Зелёная'}
                      {player.team === 'yellow' && '🟡 Жёлтая'}
                    </span>
                  )}
                  {showTeams && isHost && player.isBot && onSetTeam && (
                    <div className="flex gap-1 mt-2">
                      {teamOptions.map(t => (
                        <button
                          key={t.id}
                          onClick={() => onSetTeam(player.id, t.id)}
                          className={`w-7 h-7 rounded-full ${t.color} text-white text-xs flex items-center justify-center hover:scale-110 transition-transform ${
                            player.team === t.id ? 'ring-2 ring-white ring-offset-2' : 'opacity-50'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-2xl font-black" style={{ color: player.color }}>
                  {player.wordsFound}
                </div>
                
                {isHost && !isCurrentPlayer && onRemovePlayer && status === 'waiting' && (
                  <button
                    onClick={() => {
                      if (confirm(`Удалить ${player.name}?`)) {
                        onRemovePlayer(player.id);
                      }
                    }}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/20 p-2 rounded-lg transition-all"
                  >
                    🗑️
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

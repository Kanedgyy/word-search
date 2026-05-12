'use client';

interface FoundWordsListProps {
  foundWords: string[];
  totalCount: number;
}

export function FoundWordsList({ foundWords, totalCount }: FoundWordsListProps) {
  const progress = Math.round((foundWords.length / totalCount) * 100);

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/20">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-white text-lg">📝 Слова</h3>
          <span className="text-white/80 font-semibold">
            {foundWords.length} / {totalCount}
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-green-400 to-emerald-500 h-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Список найденных слов */}
      {foundWords.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {foundWords.map((word, index) => (
            <div
              key={word}
              className="bg-green-500/20 border border-green-400/50 rounded-lg px-3 py-2 text-center text-white font-semibold text-sm animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {word}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-white/50">
          <div className="text-4xl mb-2">🔍</div>
          <p>Найдите первые слова!</p>
        </div>
      )}
    </div>
  );
}

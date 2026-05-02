import { generateWordSearch, getRandomWordSubset } from '../lib/word-search';

console.log('=== Тест генерации филворда ===\n');

for (let i = 0; i < 5; i++) {
  const words = getRandomWordSubset(10);
  console.log(`Попытка ${i + 1}:`);
  console.log('  Слова для размещения:', words);
  
  const result = generateWordSearch(words);
  console.log('  Размещено:', result.placedWords.length, result.placedWords);
  console.log('  Не размещено:', result.failedWords.length, result.failedWords);
  console.log();
}

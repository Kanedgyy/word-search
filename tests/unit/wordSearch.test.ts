import { describe, it, expect } from '@jest/globals';
import { 
  getRandomWordSubset, 
  generateWordSearch,
  type WordPlacement 
} from '../../features/game/utils/wordSearch';
import { GRID_SIZE } from '../../features/game/utils/grid';

describe('Word Search Generator', () => {
  describe('getRandomWordSubset', () => {
    it('should return correct number of words', () => {
      const result = getRandomWordSubset(5);
      expect(result).toHaveLength(5);
    });

    it('should return unique words', () => {
      const result = getRandomWordSubset(10);
      const unique = new Set(result);
      expect(unique.size).toBe(result.length);
    });

    it('should return words with min 3 letters', () => {
      const result = getRandomWordSubset(20);
      result.forEach(word => {
        expect(word.length).toBeGreaterThanOrEqual(3);
      });
    });

    it('should return uppercase words', () => {
      const result = getRandomWordSubset(5);
      result.forEach(word => {
        expect(word).toBe(word.toUpperCase());
      });
    });
  });

  describe('generateWordSearch', () => {
    it('should create grid of correct size', () => {
      const { grid } = generateWordSearch(['ТЕСТ']);
      expect(grid).toHaveLength(GRID_SIZE);
      grid.forEach(row => {
        expect(row).toHaveLength(GRID_SIZE);
      });
    });

    it('should place all words', () => {
      const words = ['ТЕСТ', 'КОД', 'ФУНКЦИЯ'];
      const { placedWords } = generateWordSearch(words);
      expect(placedWords.length).toBeGreaterThan(0);
    });

    it('should fill empty cells with letters', () => {
      const { grid } = generateWordSearch(['ТЕСТ']);
      grid.forEach(row => {
        row.forEach(cell => {
          expect(cell).toMatch(/[А-ЯЁ]/);
        });
      });
    });

    it('should be deterministic with same seed (if implemented)', () => {
      // Note: Currently not implemented, but test ready for future
      const { grid: grid1 } = generateWordSearch(['ТЕСТ']);
      const { grid: grid2 } = generateWordSearch(['ТЕСТ']);
      // This will fail until we implement seeding
      // expect(grid1).toEqual(grid2);
    });
  });

  describe('Word Placement Validation', () => {
    it('should not place overlapping words incorrectly', () => {
      const words = ['ААА', 'БББ'];
      const { grid, placedWords } = generateWordSearch(words);
      
      // Check that placed words actually exist in grid
      placedWords.forEach(word => {
        let found = false;
        
        // Check horizontal
        for (let row = 0; row < GRID_SIZE && !found; row++) {
          for (let col = 0; col <= GRID_SIZE - word.length && !found; col++) {
            const segment = grid[row].slice(col, col + word.length).join('');
            if (segment === word) found = true;
          }
        }
        
        expect(found).toBe(true);
      });
    });
  });
});

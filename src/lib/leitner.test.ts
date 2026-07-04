import { describe, it, expect } from 'vitest';
import { updateLeitnerCard, isCardDue, LEITNER_INTERVALS } from './leitner';

describe('Leitner System Algorithm', () => {
  const baseDate = new Date('2026-07-04T12:00:00.000Z');

  describe('updateLeitnerCard', () => {
    it('should promote level 1 to level 2 on success and set correct review interval (3 days)', () => {
      const card = { level: 1, nextReviewDate: baseDate.toISOString() };
      const updated = updateLeitnerCard(card, true, baseDate);

      expect(updated.level).toBe(2);
      expect(updated.lastReviewedDate).toBe(baseDate.toISOString());
      
      // Expected date: July 7 (July 4 + 3 days)
      const expectedDate = new Date(baseDate.getTime());
      expectedDate.setDate(expectedDate.getDate() + LEITNER_INTERVALS[1]); // 3 days
      expect(updated.nextReviewDate).toBe(expectedDate.toISOString());
    });

    it('should promote level 2 to level 3 on success and set correct review interval (7 days)', () => {
      const card = { level: 2, nextReviewDate: baseDate.toISOString() };
      const updated = updateLeitnerCard(card, true, baseDate);

      expect(updated.level).toBe(3);
      
      // Expected date: July 11 (July 4 + 7 days)
      const expectedDate = new Date(baseDate.getTime());
      expectedDate.setDate(expectedDate.getDate() + LEITNER_INTERVALS[2]); // 7 days
      expect(updated.nextReviewDate).toBe(expectedDate.toISOString());
    });

    it('should not exceed max level (5) and set interval of 30 days', () => {
      const card = { level: 5, nextReviewDate: baseDate.toISOString() };
      const updated = updateLeitnerCard(card, true, baseDate);

      expect(updated.level).toBe(5);
      
      // Expected date: August 3 (July 4 + 30 days)
      const expectedDate = new Date(baseDate.getTime());
      expectedDate.setDate(expectedDate.getDate() + LEITNER_INTERVALS[4]); // 30 days
      expect(updated.nextReviewDate).toBe(expectedDate.toISOString());
    });

    it('should reset level to 1 and set interval of 1 day on fail', () => {
      const card = { level: 3, nextReviewDate: baseDate.toISOString() };
      const updated = updateLeitnerCard(card, false, baseDate);

      expect(updated.level).toBe(1);
      
      // Expected date: July 5 (July 4 + 1 day)
      const expectedDate = new Date(baseDate.getTime());
      expectedDate.setDate(expectedDate.getDate() + LEITNER_INTERVALS[0]); // 1 day
      expect(updated.nextReviewDate).toBe(expectedDate.toISOString());
    });

    it('should handle invalid levels gracefully by treating them within bounds', () => {
      const cardZero = { level: 0, nextReviewDate: baseDate.toISOString() };
      const cardHigh = { level: 10, nextReviewDate: baseDate.toISOString() };

      const updatedZero = updateLeitnerCard(cardZero, true, baseDate);
      const updatedHigh = updateLeitnerCard(cardHigh, true, baseDate);

      expect(updatedZero.level).toBe(2); // 0 becomes 1, then +1 = 2
      expect(updatedHigh.level).toBe(5); // 10 becomes 5, stays 5
    });
  });

  describe('isCardDue', () => {
    it('should return true if review date is in the past compared to current date', () => {
      const reviewDate = '2026-07-03T12:00:00.000Z'; // Yesterday
      expect(isCardDue(reviewDate, baseDate)).toBe(true);
    });

    it('should return true if review date is exactly current date', () => {
      const reviewDate = baseDate.toISOString();
      expect(isCardDue(reviewDate, baseDate)).toBe(true);
    });

    it('should return false if review date is in the future compared to current date', () => {
      const reviewDate = '2026-07-05T12:00:00.000Z'; // Tomorrow
      expect(isCardDue(reviewDate, baseDate)).toBe(false);
    });
  });
});

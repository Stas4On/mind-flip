export interface LeitnerCard {
  level: number; // 1 to 5
  nextReviewDate: string; // ISO String
  lastReviewedDate?: string; // ISO String
}

// Intervals in days for each box/level (1-indexed: level 1 = 1 day, level 5 = 30 days)
export const LEITNER_INTERVALS = [1, 3, 7, 14, 30] as const;

export const MAX_LEVEL = LEITNER_INTERVALS.length;

/**
 * Calculates the next Leitner level and next review date for a flashcard.
 * 
 * @param card Current card states (level, nextReviewDate, lastReviewedDate)
 * @param isCorrect Whether the user remembered the card (true) or forgot it (false)
 * @param currentDate The time of review (defaults to now)
 * @returns Updated card properties
 */
export function updateLeitnerCard(
  card: Pick<LeitnerCard, 'level' | 'nextReviewDate' | 'lastReviewedDate'>,
  isCorrect: boolean,
  currentDate: Date = new Date()
): LeitnerCard {
  // Ensure level is between 1 and MAX_LEVEL
  const currentLevel = Math.max(1, Math.min(card.level, MAX_LEVEL));
  
  let nextLevel: number;
  
  if (isCorrect) {
    // Increase level up to maximum box
    nextLevel = Math.min(currentLevel + 1, MAX_LEVEL);
  } else {
    // Reset to box 1 if forgotten
    nextLevel = 1;
  }
  
  // Calculate next review date
  const daysToAdd = LEITNER_INTERVALS[nextLevel - 1];
  const nextReview = new Date(currentDate.getTime());
  nextReview.setDate(nextReview.getDate() + daysToAdd);
  
  return {
    level: nextLevel,
    nextReviewDate: nextReview.toISOString(),
    lastReviewedDate: currentDate.toISOString()
  };
}

/**
 * Helper to check if a card is currently due for review.
 * 
 * @param nextReviewDate ISO string of the next review date
 * @param currentDate The time of check (defaults to now)
 * @returns boolean
 */
export function isCardDue(nextReviewDate: string, currentDate: Date = new Date()): boolean {
  const reviewTime = new Date(nextReviewDate).getTime();
  const checkTime = currentDate.getTime();
  // Card is due if the review time is in the past or exactly now
  return reviewTime <= checkTime;
}


import { ExerciseCategory } from '../types';

// Simple seeded random number generator (mulberry32 algorithm)
const seededRandom = (seed: number) => {
  return function() {
    seed += 0x6D2B79F5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

// Hash function to turn a string (date string) into a number seed
const stringToHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

// Seeded shuffle function (Fisher-Yates)
const shuffleArray = <T>(array: T[], seed: number): T[] => {
  const result = [...array];
  const random = seededRandom(seed);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const EXERCISES_PER_CATEGORY = 3;

export const getDailyExercises = (
  allExercises: ExerciseCategory[],
  dateString: string
): ExerciseCategory[] => {
  if (!allExercises || allExercises.length === 0) {
    return [];
  }

  const seed = stringToHash(dateString);

  return allExercises.map((category, index) => {
    // Use a different seed for each category to ensure variety
    const categorySeed = seed + index;
    const shuffled = shuffleArray(category.exercises, categorySeed);
    
    // Take a slice, but not more than available
    const daily = shuffled.slice(0, Math.min(EXERCISES_PER_CATEGORY, shuffled.length));

    return {
      ...category,
      exercises: daily,
    };
  }).filter(category => category.exercises.length > 0); // Remove categories that might end up empty
};

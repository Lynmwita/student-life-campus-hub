import { RoommateMatchProfile } from './types';
import { DEMO_ROOMMATE_MATCHES } from './demo-data';

// Mapping canonical interest IDs to relatable student tags for roommate matching
export const CANONICAL_TO_DISPLAY_INTERESTS: Record<string, string[]> = {
  technology: ['Web Development', 'Campus Tech Club', 'Mobile App Dev', 'Robotics Club', 'Programming'],
  sports: ['Football', 'Basketball', 'Athletics & Fitness', 'Rugby'],
  arts: ['Visual Arts', 'Photography', 'Graphic Design'],
  music: ['Music & Choir', 'Band Performance', 'Sound Production'],
  faith: ['Christian Union', 'Spiritual Fellowship', 'Chaplaincy'],
  leadership: ['Student Leadership', 'Debate Society', 'Parliamentary Club'],
  community_service: ['Red Cross Volunteer', 'Environmental Club', 'Social Impact'],
  entrepreneurship: ['Startup Ideation', 'Fintech Club', 'Venture Creation'],
  health: ['Wellness & Fitness', 'Mental Health Advocacy'],
  academic_research: ['Library Study Groups', 'Data Science Group', 'Research Fellowship'],
};

/**
 * Calculates roommate compatibility scores and mutual interests based on
 * the student's saved onboarding interests.
 */
export function calculateRoommateMatches(
  studentInterests: string[],
  candidatePool: RoommateMatchProfile[] = DEMO_ROOMMATE_MATCHES
): RoommateMatchProfile[] {
  // If user hasn't selected any interests, return candidate pool as-is
  if (!studentInterests || studentInterests.length === 0) {
    return [...candidatePool].sort((a, b) => b.matchScore - a.matchScore);
  }

  // Normalize user's interests (both canonical ids and text tags)
  const normalizedUserInterests = new Set<string>();
  for (const item of studentInterests) {
    const lower = item.toLowerCase().trim();
    normalizedUserInterests.add(lower);

    // Expand canonical IDs to synonyms/tags
    if (CANONICAL_TO_DISPLAY_INTERESTS[lower]) {
      CANONICAL_TO_DISPLAY_INTERESTS[lower].forEach((tag) => {
        normalizedUserInterests.add(tag.toLowerCase().trim());
      });
    }
  }

  const results: RoommateMatchProfile[] = candidatePool.map((candidate) => {
    // Find matching interests
    const mutual = candidate.mutualInterests.filter((tag) => {
      const tagLower = tag.toLowerCase().trim();
      if (normalizedUserInterests.has(tagLower)) return true;
      for (const userInt of normalizedUserInterests) {
        if (tagLower.includes(userInt) || userInt.includes(tagLower)) return true;
      }
      return false;
    });

    // Score calculation:
    // Base compatibility (habit alignment): 60%
    // Plus 12% per mutual interest, capped at 98%
    // If no mutual interests, score drops to baseline 55%
    const computedScore = mutual.length > 0 
      ? Math.min(98, 60 + mutual.length * 14)
      : 55;

    return {
      ...candidate,
      matchScore: computedScore,
      mutualInterests: mutual.length > 0 ? mutual : candidate.mutualInterests,
    };
  });

  // Sort descending by match score
  return results.sort((a, b) => b.matchScore - a.matchScore);
}

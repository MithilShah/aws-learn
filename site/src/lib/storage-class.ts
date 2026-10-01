/**
 * Logic behind <StorageClassMatrix>: given how often data is accessed, how
 * quickly it must come back, and whether one Availability Zone is acceptable,
 * recommend an Amazon S3 storage class. Pure functions, so the browser script
 * stays thin and the recommendation is unit-tested.
 *
 * This is a teaching model of the guidance in the AWS "Understanding and
 * managing Amazon S3 storage classes" docs, not AWS's own selector. It covers
 * the general purpose storage classes a beginner meets first.
 */

/** How often the data is read. */
export type AccessPattern = 'frequent' | 'infrequent' | 'archive' | 'unknown';
/** How quickly a read must return once requested. */
export type Retrieval = 'instant' | 'minutes-to-hours';

export interface Choice {
  access: AccessPattern;
  retrieval: Retrieval;
  /** True if storing in a single Availability Zone is acceptable (cheaper, less resilient). */
  oneZoneOk: boolean;
}

/** A storage class the matrix can recommend. */
export interface StorageClass {
  id: string;
  /** Display name, e.g. 'S3 Standard-IA'. */
  name: string;
  /** One-line summary of what it's for. */
  summary: string;
}

export const CLASSES: Record<string, StorageClass> = {
  standard: { id: 'standard', name: 'S3 Standard', summary: 'Frequently accessed data, millisecond access.' },
  intelligentTiering: {
    id: 'intelligentTiering',
    name: 'S3 Intelligent-Tiering',
    summary: 'Unknown or changing access patterns; S3 moves objects between tiers automatically.',
  },
  standardIA: {
    id: 'standardIA',
    name: 'S3 Standard-IA',
    summary: 'Infrequently accessed data that still needs instant access, across multiple AZs.',
  },
  oneZoneIA: {
    id: 'oneZoneIA',
    name: 'S3 One Zone-IA',
    summary: 'Infrequently accessed data you can afford to store in a single Availability Zone.',
  },
  glacierInstant: {
    id: 'glacierInstant',
    name: 'S3 Glacier Instant Retrieval',
    summary: 'Archive data that is rarely read but must come back in milliseconds when it is.',
  },
  glacierFlexible: {
    id: 'glacierFlexible',
    name: 'S3 Glacier Flexible Retrieval',
    summary: 'Archive data where retrieval in minutes to hours is acceptable.',
  },
  deepArchive: {
    id: 'deepArchive',
    name: 'S3 Glacier Deep Archive',
    summary: 'The lowest-cost class, for long-term archives retrieved in hours.',
  },
};

/**
 * Recommend a storage class for an access pattern. Returns the class id and a
 * short reason. The rules intentionally mirror the beginner-level guidance:
 *   - unknown/changing access  -> Intelligent-Tiering
 *   - frequent access          -> Standard
 *   - infrequent, instant      -> One Zone-IA if a single AZ is OK, else Standard-IA
 *   - archive, instant         -> Glacier Instant Retrieval
 *   - archive, minutes-to-hours-> Deep Archive (lowest cost) else Flexible Retrieval
 */
export function recommend(choice: Choice): { classId: string; reason: string } {
  const { access, retrieval, oneZoneOk } = choice;

  if (access === 'unknown') {
    return {
      classId: 'intelligentTiering',
      reason: 'When access is unpredictable, Intelligent-Tiering moves each object to the right tier automatically.',
    };
  }

  if (access === 'frequent') {
    return { classId: 'standard', reason: 'Frequently accessed data belongs in S3 Standard for millisecond access.' };
  }

  if (access === 'infrequent') {
    if (retrieval === 'instant') {
      return oneZoneOk
        ? {
            classId: 'oneZoneIA',
            reason: 'Infrequent access with instant reads, and one Availability Zone is acceptable: One Zone-IA is cheapest.',
          }
        : {
            classId: 'standardIA',
            reason: 'Infrequent access with instant reads across multiple AZs: Standard-IA.',
          };
    }
    // Infrequent but retrieval delay acceptable: treat like a light archive.
    return {
      classId: 'glacierInstant',
      reason: 'Rarely accessed data that still needs quick reads fits Glacier Instant Retrieval.',
    };
  }

  // access === 'archive'
  if (retrieval === 'instant') {
    return {
      classId: 'glacierInstant',
      reason: 'Archive data that must still return in milliseconds: Glacier Instant Retrieval.',
    };
  }
  return {
    classId: 'deepArchive',
    reason: 'Archive data where retrieval in hours is fine: Glacier Deep Archive is the lowest cost.',
  };
}

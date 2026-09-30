/**
 * Loads the journeys collection and builds validated journeys. Kept apart
 * from journey.ts because astro:content only exists inside Astro.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { SERVICES } from '../data/services';
import { buildJourneys, type Journey } from './journey';

export type JourneyEntry = CollectionEntry<'journeys'>;

export async function getJourneys(): Promise<Journey<JourneyEntry>[]> {
  return buildJourneys(await getCollection('journeys'), SERVICES);
}

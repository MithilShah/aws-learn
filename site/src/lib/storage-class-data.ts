/**
 * The access-pattern options the <StorageClassMatrix> offers, and a set of
 * worked scenarios. Kept separate from the engine (storage-class.ts) so the
 * options and the expected recommendations can be unit-tested.
 */
import type { AccessPattern, Choice, Retrieval } from './storage-class';

export const accessOptions: { value: AccessPattern; label: string }[] = [
  { value: 'frequent', label: 'Accessed often' },
  { value: 'infrequent', label: 'Accessed rarely' },
  { value: 'archive', label: 'Archived (almost never)' },
  { value: 'unknown', label: 'Unknown or changing' },
];

export const retrievalOptions: { value: Retrieval; label: string }[] = [
  { value: 'instant', label: 'Instantly (milliseconds)' },
  { value: 'minutes-to-hours', label: 'Minutes to hours is fine' },
];

/** Scenarios shown in the static table and used as unit-test fixtures. */
export const scenarios: { label: string; choice: Choice; expectedClassId: string }[] = [
  {
    label: 'A website\u2019s images, served to visitors all day',
    choice: { access: 'frequent', retrieval: 'instant', oneZoneOk: false },
    expectedClassId: 'standard',
  },
  {
    label: 'A new dataset whose access pattern you don\u2019t know yet',
    choice: { access: 'unknown', retrieval: 'instant', oneZoneOk: false },
    expectedClassId: 'intelligentTiering',
  },
  {
    label: 'Monthly reports, read now and then, needed instantly',
    choice: { access: 'infrequent', retrieval: 'instant', oneZoneOk: false },
    expectedClassId: 'standardIA',
  },
  {
    label: 'Reproducible thumbnails, read rarely, one AZ is fine',
    choice: { access: 'infrequent', retrieval: 'instant', oneZoneOk: true },
    expectedClassId: 'oneZoneIA',
  },
  {
    label: 'Compliance archives, rarely read but instantly when audited',
    choice: { access: 'archive', retrieval: 'instant', oneZoneOk: false },
    expectedClassId: 'glacierInstant',
  },
  {
    label: 'Seven-year tax records, retrieval in hours is fine',
    choice: { access: 'archive', retrieval: 'minutes-to-hours', oneZoneOk: false },
    expectedClassId: 'deepArchive',
  },
];

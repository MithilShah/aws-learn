/**
 * The sample object keys the <KeyPrefixExplorer> on the buckets-and-objects
 * page uses. Kept separate from the engine (key-prefix.ts) so the sample set
 * and its derived tree can be unit-tested. These are plain object keys in one
 * bucket; the "folders" are only the shared prefixes between them.
 */

/** Example keys in a single bucket, as a flat list — which is how S3 stores them. */
export const sampleKeys: readonly string[] = [
  'photos/2025/beach.jpg',
  'photos/2026/cat.jpg',
  'photos/2026/dog.jpg',
  'invoices/2026/january.pdf',
  'readme.txt',
];

/**
 * Registry of service journeys, in the order the hub lists them. Each id
 * must match a folder in <repo>/journeys/ that contains an index.mdx.
 * The build fails if a folder isn't registered here, or vice versa.
 */
export interface Service {
  /** URL segment and journeys/ folder name, e.g. 'config' -> /aws/config/. */
  id: string;
  /** Official service name, e.g. 'AWS Config'. */
  name: string;
}

export const SERVICES: readonly Service[] = [
  { id: 'config', name: 'AWS Config' },
  { id: 's3', name: 'Amazon S3' },
];

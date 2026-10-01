/**
 * Logic behind <VersionTimeline>: apply a sequence of operations to one key
 * in a versioning-enabled Amazon S3 bucket and work out the resulting stack
 * of versions, including delete markers. Pure functions, so the browser
 * script stays thin and the behaviour is unit-tested.
 *
 * Model (from the S3 "Using versioning in S3 buckets" docs):
 *   - A PUT creates a new version with a new version ID and makes it current.
 *   - A DELETE (without a version ID) does NOT remove data: it adds a delete
 *     marker as the new current version. A GET then behaves as "not found".
 *   - Deleting the delete marker (undo) makes the previous version current
 *     again — this is how you recover an "accidentally deleted" object.
 * Older versions are never overwritten; they stack up beneath the current one.
 */

export type Operation =
  | { type: 'put'; label: string }
  | { type: 'delete' }
  | { type: 'undo-delete' };

export interface Version {
  /** Short synthetic version id, e.g. 'v1'. */
  versionId: string;
  /** True for a delete marker (no data). */
  isDeleteMarker: boolean;
  /** For a real version, a human label like 'cat.jpg (edit 2)'. */
  label?: string;
}

export interface TimelineState {
  /** Newest first: index 0 is the current version. */
  versions: Version[];
}

/** Whether a GET on the key would currently succeed (true) or 404 (false). */
export function isReadable(state: TimelineState): boolean {
  const current = state.versions[0];
  return current !== undefined && !current.isDeleteMarker;
}

/** The current version, or undefined if the stack is empty. */
export function currentVersion(state: TimelineState): Version | undefined {
  return state.versions[0];
}

/**
 * Apply one operation, returning a new state. Version ids are assigned from a
 * running counter based on how many versions already exist, so ids are stable
 * and readable (v1, v2, …). `undo-delete` only does something when the current
 * version is a delete marker.
 */
export function apply(state: TimelineState, op: Operation): TimelineState {
  const nextId = () => `v${state.versions.length + 1}`;

  switch (op.type) {
    case 'put':
      return { versions: [{ versionId: nextId(), isDeleteMarker: false, label: op.label }, ...state.versions] };
    case 'delete':
      // A delete with no version id adds a delete marker; nothing is removed.
      return { versions: [{ versionId: nextId(), isDeleteMarker: true }, ...state.versions] };
    case 'undo-delete': {
      // Removing the current delete marker exposes the version beneath it.
      if (!state.versions[0]?.isDeleteMarker) return state;
      return { versions: state.versions.slice(1) };
    }
  }
}

/** Run a whole sequence from an empty key. */
export function run(ops: readonly Operation[]): TimelineState {
  return ops.reduce<TimelineState>(apply, { versions: [] });
}

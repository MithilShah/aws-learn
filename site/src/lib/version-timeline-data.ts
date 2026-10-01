/**
 * The scripted sequence of operations the <VersionTimeline> walks through,
 * telling the story of an accidental delete and its recovery on a
 * versioning-enabled bucket. Kept separate from the engine
 * (version-timeline.ts) so the sequence and its outcomes can be unit-tested.
 */
import type { Operation } from './version-timeline';

/** Each step pairs an operation with the sentence shown alongside it. */
export interface TimelineStep {
  op: Operation;
  title: string;
  text: string;
}

export const steps: TimelineStep[] = [
  {
    op: { type: 'put', label: 'report.pdf (v1)' },
    title: 'Upload the object.',
    text: 'You PUT report.pdf. S3 stores it as version v1, which is now current.',
  },
  {
    op: { type: 'put', label: 'report.pdf (edit)' },
    title: 'Overwrite it with an edit.',
    text: 'A new PUT to the same key creates version v2. v1 is kept beneath it, not replaced.',
  },
  {
    op: { type: 'delete' },
    title: 'Delete the object.',
    text: 'A DELETE adds a delete marker as the new current version. A GET now behaves as "not found" — but no data was removed.',
  },
  {
    op: { type: 'undo-delete' },
    title: 'Recover it.',
    text: 'Removing the delete marker makes v2 current again. The object is back, because versioning never discarded it.',
  },
];

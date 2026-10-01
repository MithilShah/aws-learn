/**
 * Logic behind <StorageSorter>: a click-to-assign exercise where the reader
 * decides which AWS storage service — Amazon S3 (object), Amazon EBS (block)
 * or Amazon EFS (file) — fits each workload. Pure functions, so the browser
 * script stays thin and the scoring is unit-tested.
 *
 * This mirrors lib/service-sorter but for the storage comparison; it is kept
 * separate so the Config journey's ServiceSorter is untouched.
 */

export type StorageId = 's3' | 'ebs' | 'efs';

/** A workload the reader assigns to a storage service. */
export interface StorageQuestion {
  id: string;
  /** The workload description, e.g. "A boot volume for one EC2 instance." */
  prompt: string;
  /** The service that fits it. */
  answer: StorageId;
  /** Why — shown after the reader assigns the question. */
  because: string;
}

/** The reader's current assignments: question id -> chosen service (or none). */
export type Assignments = Record<string, StorageId | undefined>;

/** Whether a single assignment is correct. Unassigned is never correct. */
export function isCorrect(question: StorageQuestion, choice: StorageId | undefined): boolean {
  return choice !== undefined && choice === question.answer;
}

export interface Score {
  correct: number;
  answered: number;
  total: number;
  /** True only when every question is assigned and every assignment is right. */
  allCorrect: boolean;
}

/** Score a set of assignments against the questions. */
export function score(questions: readonly StorageQuestion[], assignments: Assignments): Score {
  let correct = 0;
  let answered = 0;
  for (const q of questions) {
    const choice = assignments[q.id];
    if (choice !== undefined) answered++;
    if (isCorrect(q, choice)) correct++;
  }
  return {
    correct,
    answered,
    total: questions.length,
    allCorrect: correct === questions.length,
  };
}

/** Short "N of M correct" summary for the UI and the live region. */
export function scoreText({ correct, total }: Score): string {
  return `${correct} of ${total} correct`;
}

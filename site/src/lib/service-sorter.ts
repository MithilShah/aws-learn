/**
 * Logic behind <ServiceSorter>: a click-to-assign exercise where the reader
 * decides which of AWS Config, AWS CloudTrail or Amazon CloudWatch answers a
 * given question. Pure functions, so the browser script stays thin and the
 * scoring is unit-tested.
 */

export type ServiceId = 'config' | 'cloudtrail' | 'cloudwatch';

/** A question the reader assigns to a service. */
export interface SorterQuestion {
  id: string;
  /** The question text, e.g. "Who made the API call that changed this?" */
  prompt: string;
  /** The service that actually answers it. */
  answer: ServiceId;
  /** Why — shown after the reader assigns the question. */
  because: string;
}

/** The reader's current assignments: question id -> chosen service (or none). */
export type Assignments = Record<string, ServiceId | undefined>;

/** Whether a single assignment is correct. Unassigned is never correct. */
export function isCorrect(question: SorterQuestion, choice: ServiceId | undefined): boolean {
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
export function score(questions: readonly SorterQuestion[], assignments: Assignments): Score {
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

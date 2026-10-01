import { describe, expect, it } from 'vitest';
import { isCorrect, score, scoreText, type Assignments, type StorageQuestion } from '../src/lib/storage-sorter';
import { questions, services } from '../src/lib/storage-sorter-data';

const q = (id: string): StorageQuestion => {
  const found = questions.find((x) => x.id === id);
  if (!found) throw new Error(`no question ${id}`);
  return found;
};

describe('isCorrect', () => {
  it('is true only when the choice matches the answer', () => {
    expect(isCorrect(q('database-volume'), 'ebs')).toBe(true);
    expect(isCorrect(q('database-volume'), 's3')).toBe(false);
  });

  it('treats an unassigned question as not correct', () => {
    expect(isCorrect(q('database-volume'), undefined)).toBe(false);
  });
});

describe('score', () => {
  it('counts correct and answered, and flags a perfect run', () => {
    const perfect: Assignments = Object.fromEntries(questions.map((x) => [x.id, x.answer]));
    expect(score(questions, perfect)).toEqual({
      correct: questions.length,
      answered: questions.length,
      total: questions.length,
      allCorrect: true,
    });
  });

  it('does not flag allCorrect until everything is assigned, even with no wrong answers', () => {
    const partial: Assignments = { [questions[0].id]: questions[0].answer };
    const s = score(questions, partial);
    expect(s.correct).toBe(1);
    expect(s.answered).toBe(1);
    expect(s.allCorrect).toBe(false);
  });

  it('counts a wrong assignment as answered but not correct', () => {
    const wrong: Assignments = { 'media-library': 'ebs', 'database-volume': 'ebs' };
    const s = score(questions, wrong);
    expect(s.answered).toBe(2);
    expect(s.correct).toBe(1);
    expect(s.allCorrect).toBe(false);
  });

  it('ignores an empty assignment map', () => {
    expect(score(questions, {})).toMatchObject({ correct: 0, answered: 0, allCorrect: false });
  });
});

describe('scoreText', () => {
  it('summarises as "N of M correct"', () => {
    expect(scoreText({ correct: 4, answered: 5, total: 6, allCorrect: false })).toBe('4 of 6 correct');
  });
});

describe('question data', () => {
  it('every question targets one of the three services', () => {
    const ids = new Set(services.map((s) => s.id));
    for (const question of questions) expect(ids.has(question.answer)).toBe(true);
  });

  it('covers all three services at least once', () => {
    const answered = new Set(questions.map((x) => x.answer));
    expect(answered).toEqual(new Set(['s3', 'ebs', 'efs']));
  });

  it('has unique question ids', () => {
    expect(new Set(questions.map((x) => x.id)).size).toBe(questions.length);
  });
});

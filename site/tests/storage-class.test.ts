import { describe, expect, it } from 'vitest';
import { CLASSES, recommend, type Choice } from '../src/lib/storage-class';
import { scenarios } from '../src/lib/storage-class-data';

const choice = (over: Partial<Choice>): Choice => ({
  access: 'frequent',
  retrieval: 'instant',
  oneZoneOk: false,
  ...over,
});

describe('recommend', () => {
  it('sends unknown/changing access to Intelligent-Tiering, whatever the other inputs', () => {
    expect(recommend(choice({ access: 'unknown' })).classId).toBe('intelligentTiering');
    expect(recommend(choice({ access: 'unknown', retrieval: 'minutes-to-hours', oneZoneOk: true })).classId).toBe(
      'intelligentTiering',
    );
  });

  it('sends frequent access to S3 Standard', () => {
    expect(recommend(choice({ access: 'frequent' })).classId).toBe('standard');
  });

  it('picks between Standard-IA and One Zone-IA by whether a single AZ is acceptable', () => {
    expect(recommend(choice({ access: 'infrequent', retrieval: 'instant', oneZoneOk: false })).classId).toBe('standardIA');
    expect(recommend(choice({ access: 'infrequent', retrieval: 'instant', oneZoneOk: true })).classId).toBe('oneZoneIA');
  });

  it('sends instant-retrieval archives to Glacier Instant Retrieval', () => {
    expect(recommend(choice({ access: 'archive', retrieval: 'instant' })).classId).toBe('glacierInstant');
  });

  it('sends delay-tolerant archives to Deep Archive, the lowest cost', () => {
    expect(recommend(choice({ access: 'archive', retrieval: 'minutes-to-hours' })).classId).toBe('deepArchive');
  });

  it('always returns a reason and a class that exists', () => {
    const result = recommend(choice({ access: 'infrequent' }));
    expect(result.reason.length).toBeGreaterThan(0);
    expect(CLASSES[result.classId]).toBeDefined();
  });
});

describe('scenarios data', () => {
  it('every scenario recommends its expected class', () => {
    for (const s of scenarios) {
      expect(recommend(s.choice).classId, s.label).toBe(s.expectedClassId);
    }
  });

  it('each expected class id is a real class', () => {
    for (const s of scenarios) expect(CLASSES[s.expectedClassId], s.label).toBeDefined();
  });
});

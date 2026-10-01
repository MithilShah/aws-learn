import { describe, expect, it } from 'vitest';
import { evaluate, resultLabel, resultReason, type SimResource, type SimRule } from '../src/lib/rule-simulator';
import { resources, rules } from '../src/lib/rule-simulator-data';

const rule = (id: string): SimRule => {
  const found = rules.find((r) => r.id === id);
  if (!found) throw new Error(`no rule ${id}`);
  return found;
};
const resource = (id: string): SimResource => {
  const found = resources.find((r) => r.id === id);
  if (!found) throw new Error(`no resource ${id}`);
  return found;
};

describe('evaluate: scope', () => {
  it('is NOT_APPLICABLE when the rule does not target the resource type', () => {
    // encrypted-volumes targets EBS volumes, not S3 buckets.
    expect(evaluate(rule('encrypted-volumes'), resource('versioned-bucket'))).toBe('NOT_APPLICABLE');
    expect(evaluate(rule('s3-bucket-versioning-enabled'), resource('encrypted-volume'))).toBe('NOT_APPLICABLE');
  });
});

describe('encrypted-volumes', () => {
  const r = rule('encrypted-volumes');

  it('is COMPLIANT for an encrypted volume', () => {
    expect(evaluate(r, resource('encrypted-volume'))).toBe('COMPLIANT');
  });

  it('is NON_COMPLIANT for an unencrypted volume', () => {
    expect(evaluate(r, resource('unencrypted-volume'))).toBe('NON_COMPLIANT');
  });

  it('is NON_COMPLIANT when the KMS key is not the one required by kmsId', () => {
    expect(evaluate(r, resource('encrypted-volume'), { kmsId: 'key-different' })).toBe('NON_COMPLIANT');
  });

  it('is COMPLIANT when the KMS key matches the required kmsId', () => {
    expect(evaluate(r, resource('encrypted-volume'), { kmsId: 'key-approved' })).toBe('COMPLIANT');
  });
});

describe('s3-bucket-versioning-enabled', () => {
  const r = rule('s3-bucket-versioning-enabled');

  it('is COMPLIANT when versioning is on, NON_COMPLIANT when off', () => {
    expect(evaluate(r, resource('versioned-bucket'))).toBe('COMPLIANT');
    expect(evaluate(r, resource('plain-bucket'))).toBe('NON_COMPLIANT');
  });
});

describe('required-tags', () => {
  const r = rule('required-tags');

  it('is ERROR when the required tagKey parameter is missing or blank', () => {
    expect(evaluate(r, resource('versioned-bucket'))).toBe('ERROR');
    expect(evaluate(r, resource('versioned-bucket'), { tagKey: '  ' })).toBe('ERROR');
  });

  it('checks for the tag once the parameter is supplied', () => {
    expect(evaluate(r, resource('versioned-bucket'), { tagKey: 'team' })).toBe('COMPLIANT');
    expect(evaluate(r, resource('plain-bucket'), { tagKey: 'team' })).toBe('NON_COMPLIANT');
  });
});

describe('result text', () => {
  it('labels every result', () => {
    expect(resultLabel('COMPLIANT')).toBe('Compliant');
    expect(resultLabel('NON_COMPLIANT')).toBe('Noncompliant');
    expect(resultLabel('ERROR')).toBe('Error');
    expect(resultLabel('NOT_APPLICABLE')).toBe('Not applicable');
  });

  it('explains every result, naming the rule', () => {
    expect(resultReason('COMPLIANT', 'encrypted-volumes')).toContain('passes');
    expect(resultReason('NON_COMPLIANT', 'encrypted-volumes')).toContain('fails');
    expect(resultReason('ERROR', 'required-tags')).toContain('required parameter');
    expect(resultReason('NOT_APPLICABLE', 'encrypted-volumes')).toContain('does not apply');
  });
});

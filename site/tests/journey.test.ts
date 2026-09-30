import { describe, expect, it } from 'vitest';
import type { Service } from '../src/data/services';
import {
  buildJourneys,
  neighbors,
  overviewPath,
  parseEntryId,
  stepNumber,
  stepPath,
  type JourneyEntryLike,
} from '../src/lib/journey';

const SERVICES: Service[] = [
  { id: 'config', name: 'AWS Config' },
  { id: 's3', name: 'Amazon S3' },
];

function entry(id: string, navTitle: string, order?: number): JourneyEntryLike {
  return { id, data: { navTitle, order } };
}

// Deliberately out of order, and interleaved across services.
const ENTRIES = [
  entry('config/config-rules', 'Config rules', 3),
  entry('s3/index', 'Overview'),
  entry('config/index', 'Overview'),
  entry('config/what-is-aws-config', 'What is AWS Config?', 1),
  entry('s3/buckets', 'Buckets', 1),
  entry('config/how-it-works', 'How it works', 2),
];

function config() {
  return buildJourneys(ENTRIES, SERVICES)[0];
}

describe('parseEntryId', () => {
  it('splits service and slug', () => {
    expect(parseEntryId('config/how-it-works')).toEqual({ service: 'config', slug: 'how-it-works' });
    expect(parseEntryId('config/index')).toEqual({ service: 'config', slug: 'index' });
  });

  it.each(['index', 'config/rules/extra', 'Config/index', 'config/How-It-Works', 'config/rules_1', 'config/-rules'])(
    'rejects "%s"',
    (id) => {
      expect(() => parseEntryId(id)).toThrow(/journeys\/<service>\/<page>\.mdx/);
    },
  );
});

describe('paths', () => {
  it('are relative to the site base, with trailing slashes', () => {
    expect(overviewPath('config')).toBe('config/');
    expect(stepPath('config', 'how-it-works')).toBe('config/how-it-works/');
  });
});

describe('buildJourneys', () => {
  it('returns journeys in registry order', () => {
    expect(buildJourneys(ENTRIES, SERVICES).map((j) => j.service.id)).toEqual(['config', 's3']);
  });

  it('finds the overview and sorts steps by order, not file order', () => {
    const journey = config();
    expect(journey.overview.id).toBe('config/index');
    expect(journey.steps.map((s) => s.id)).toEqual([
      'config/what-is-aws-config',
      'config/how-it-works',
      'config/config-rules',
    ]);
  });

  it('allows gaps in order, so steps can be inserted later', () => {
    const [journey] = buildJourneys(
      [entry('config/index', 'Overview'), entry('config/b', 'B', 20), entry('config/a', 'A', 10)],
      [SERVICES[0]],
    );
    expect(journey.steps.map((s) => s.id)).toEqual(['config/a', 'config/b']);
  });

  it('allows a journey with only an overview', () => {
    const [journey] = buildJourneys([entry('config/index', 'Overview')], [SERVICES[0]]);
    expect(journey.steps).toEqual([]);
  });

  it('rejects duplicate orders, naming both files', () => {
    expect(() =>
      buildJourneys([...ENTRIES, entry('config/remediation', 'Remediation', 2)], SERVICES),
    ).toThrow(/"journeys\/config\/(how-it-works|remediation)\.mdx" and "journeys\/config\/(how-it-works|remediation)\.mdx" both have order 2/);
  });

  it('rejects a step without an order', () => {
    expect(() => buildJourneys([...ENTRIES, entry('config/remediation', 'Remediation')], SERVICES)).toThrow(
      /journeys\/config\/remediation\.mdx" is missing "order"/,
    );
  });

  it('rejects a registered service without an overview', () => {
    const noOverview = ENTRIES.filter((e) => e.id !== 's3/index');
    expect(() => buildJourneys(noOverview, SERVICES)).toThrow(/Service "s3" has no overview page/);
  });

  it('rejects content for a service missing from the registry', () => {
    expect(() => buildJourneys([...ENTRIES, entry('iam/index', 'Overview')], SERVICES)).toThrow(
      /unknown service "iam".*services\.ts/,
    );
  });

  it('rejects misplaced files', () => {
    expect(() => buildJourneys([...ENTRIES, entry('stray', 'Stray')], SERVICES)).toThrow(/journeys\/stray\.mdx/);
  });

  it('reports every problem at once', () => {
    const bad = [
      ...ENTRIES.filter((e) => e.id !== 's3/index'),
      entry('config/remediation', 'Remediation'),
      entry('iam/index', 'Overview'),
    ];
    expect(() => buildJourneys(bad, SERVICES)).toThrow(/has 3 problem\(s\)/);
  });
});

describe('stepNumber', () => {
  it('is the 1-based position after sorting', () => {
    const journey = config();
    expect(stepNumber(journey, 'what-is-aws-config')).toBe(1);
    expect(stepNumber(journey, 'config-rules')).toBe(3);
  });

  it('throws for an unknown step', () => {
    expect(() => stepNumber(config(), 'pricing')).toThrow(/no step "pricing"/);
  });
});

describe('neighbors', () => {
  it('overview: no previous page, next is step 1', () => {
    expect(neighbors(config(), null)).toEqual({
      prev: undefined,
      next: { path: 'config/what-is-aws-config/', label: 'What is AWS Config?' },
    });
  });

  it('first step: previous is the overview', () => {
    expect(neighbors(config(), 'what-is-aws-config')).toEqual({
      prev: { path: 'config/', label: 'Overview' },
      next: { path: 'config/how-it-works/', label: 'How it works' },
    });
  });

  it('middle step: links both ways', () => {
    expect(neighbors(config(), 'how-it-works')).toEqual({
      prev: { path: 'config/what-is-aws-config/', label: 'What is AWS Config?' },
      next: { path: 'config/config-rules/', label: 'Config rules' },
    });
  });

  it('last step: no next page', () => {
    expect(neighbors(config(), 'config-rules')).toEqual({
      prev: { path: 'config/how-it-works/', label: 'How it works' },
      next: undefined,
    });
  });

  it('overview-only journey: no neighbors at all', () => {
    const [journey] = buildJourneys([entry('config/index', 'Overview')], [SERVICES[0]]);
    expect(neighbors(journey, null)).toEqual({ prev: undefined, next: undefined });
  });

  it('throws for an unknown step', () => {
    expect(() => neighbors(config(), 'pricing')).toThrow(/no step "pricing"/);
  });
});

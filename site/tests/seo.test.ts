import { describe, expect, it } from 'vitest';
import { breadcrumbList, course, itemList, organization, shareImagePath, techArticle } from '../src/lib/seo';

const SITE = 'https://www.studytrails.com';
const OVERVIEW = `${SITE}/aws/config/`;
const STEP = `${SITE}/aws/config/how-it-works/`;

describe('organization', () => {
  it('points at the site root', () => {
    expect(organization(SITE)).toEqual({ '@type': 'Organization', name: 'StudyTrails', url: `${SITE}/` });
  });
});

describe('breadcrumbList', () => {
  it('numbers items from 1 and ends with the current page', () => {
    const ld = breadcrumbList([
      { name: 'AWS Learning Journeys', url: `${SITE}/aws/` },
      { name: 'AWS Config', url: OVERVIEW },
      { name: 'How it works', url: STEP },
    ]);
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('BreadcrumbList');
    expect(ld.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'AWS Learning Journeys', item: `${SITE}/aws/` },
      { '@type': 'ListItem', position: 2, name: 'AWS Config', item: OVERVIEW },
      { '@type': 'ListItem', position: 3, name: 'How it works', item: STEP },
    ]);
  });
});

describe('itemList', () => {
  it('lists journeys by URL and name', () => {
    expect(itemList([{ name: 'AWS Config', url: OVERVIEW }]).itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'AWS Config', url: OVERVIEW },
    ]);
  });
});

describe('course', () => {
  const ld = course({
    siteOrigin: SITE,
    url: OVERVIEW,
    name: 'AWS Config Tutorial for Beginners',
    description: 'Learn AWS Config step by step.',
    image: `${SITE}/aws/og/config.png`,
    about: 'AWS Config',
    steps: [
      { name: 'What is AWS Config?', url: `${SITE}/aws/config/what-is-aws-config/` },
      { name: 'How it works', url: STEP },
    ],
  });

  it('is a free beginner course from StudyTrails', () => {
    expect(ld).toMatchObject({
      '@type': 'Course',
      name: 'AWS Config Tutorial for Beginners',
      url: OVERVIEW,
      educationalLevel: 'Beginner',
      isAccessibleForFree: true,
      inLanguage: 'en',
      about: { '@type': 'Thing', name: 'AWS Config' },
      provider: { '@type': 'Organization', name: 'StudyTrails' },
      author: { '@type': 'Person', name: 'Mithil Shah' },
    });
  });

  it('lists its steps in order', () => {
    expect(ld.hasPart).toEqual([
      { '@type': 'TechArticle', position: 1, name: 'What is AWS Config?', url: `${SITE}/aws/config/what-is-aws-config/` },
      { '@type': 'TechArticle', position: 2, name: 'How it works', url: STEP },
    ]);
  });
});

describe('techArticle', () => {
  const ld = techArticle({
    siteOrigin: SITE,
    url: STEP,
    headline: 'How AWS Config Works',
    description: 'Follow a change through AWS Config.',
    image: `${SITE}/aws/og/config/how-it-works.png`,
    dateModified: new Date('2026-09-29T00:00:00Z'),
    about: 'AWS Config',
    course: { name: 'AWS Config Tutorial for Beginners', url: OVERVIEW },
    citations: [{ name: 'How AWS Config Works', url: 'https://docs.aws.amazon.com/config/latest/developerguide/how-does-config-work.html' }],
  });

  it('describes a beginner article that is part of the course', () => {
    expect(ld).toMatchObject({
      '@type': 'TechArticle',
      headline: 'How AWS Config Works',
      url: STEP,
      mainEntityOfPage: STEP,
      proficiencyLevel: 'Beginner',
      isPartOf: { '@type': 'Course', url: OVERVIEW },
      publisher: { '@type': 'Organization', name: 'StudyTrails' },
    });
  });

  it('uses the last-verified date as a plain ISO date', () => {
    expect(ld.dateModified).toBe('2026-09-29');
  });

  it('cites the AWS documentation it is based on', () => {
    expect(ld.citation).toEqual([
      {
        '@type': 'CreativeWork',
        name: 'How AWS Config Works',
        url: 'https://docs.aws.amazon.com/config/latest/developerguide/how-does-config-work.html',
      },
    ]);
  });
});

describe('shareImagePath', () => {
  it.each([
    ['', 'og/hub.png'],
    ['/', 'og/hub.png'],
    ['config/', 'og/config.png'],
    ['config/how-it-works/', 'og/config/how-it-works.png'],
    ['/config/how-it-works', 'og/config/how-it-works.png'],
  ])('%j -> %s', (page, expected) => {
    expect(shareImagePath(page)).toBe(expected);
  });
});

describe('JSON-LD safety', () => {
  it('serialises without losing data', () => {
    const ld = breadcrumbList([{ name: 'A "quoted" </script> name', url: STEP }]);
    expect(JSON.parse(JSON.stringify(ld))).toEqual(ld);
  });
});

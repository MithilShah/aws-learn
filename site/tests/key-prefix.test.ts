import { describe, expect, it } from 'vitest';
import { buildPrefixTree, countObjects, type PrefixNode } from '../src/lib/key-prefix';
import { sampleKeys } from '../src/lib/key-prefix-data';

/** Names of a node's children, in the order the tree produced them. */
const names = (nodes: PrefixNode[]) => nodes.map((n) => n.name);
const find = (nodes: PrefixNode[], name: string): PrefixNode => {
  const node = nodes.find((n) => n.name === name);
  if (!node) throw new Error(`no node ${name}`);
  return node;
};

describe('buildPrefixTree', () => {
  it('groups keys that share a prefix into one folder node', () => {
    const tree = buildPrefixTree(['photos/a.jpg', 'photos/b.jpg']);
    expect(tree).toHaveLength(1);
    expect(tree[0]).toMatchObject({ name: 'photos', path: 'photos/', isPrefix: true });
    expect(names(tree[0].children)).toEqual(['a.jpg', 'b.jpg']);
    expect(tree[0].children.every((c) => c.isPrefix === false)).toBe(true);
  });

  it('nests deeper prefixes and records full paths on leaves', () => {
    const tree = buildPrefixTree(sampleKeys);
    const photos = find(tree, 'photos');
    expect(names(photos.children)).toEqual(['2025', '2026']);
    const y2026 = find(photos.children, '2026');
    expect(names(y2026.children)).toEqual(['cat.jpg', 'dog.jpg']);
    expect(find(y2026.children, 'cat.jpg').path).toBe('photos/2026/cat.jpg');
  });

  it('sorts folders before objects at each level', () => {
    // 'readme.txt' is an object at the root; folders must come first.
    const tree = buildPrefixTree(sampleKeys);
    expect(names(tree)).toEqual(['invoices', 'photos', 'readme.txt']);
    expect(tree[0].isPrefix).toBe(true);
    expect(find(tree, 'readme.txt').isPrefix).toBe(false);
  });

  it('treats a key ending in the delimiter as an empty folder marker, not an object', () => {
    const tree = buildPrefixTree(['logs/']);
    expect(tree).toHaveLength(1);
    expect(tree[0]).toMatchObject({ name: 'logs', isPrefix: true });
    expect(tree[0].children).toEqual([]);
  });

  it('keeps the slashes as part of the flat key — there is no real tree in S3', () => {
    // The derived tree is a view; the leaf's path is the original flat key.
    const tree = buildPrefixTree(['a/b/c.txt']);
    const leaf = tree[0].children[0].children[0];
    expect(leaf.path).toBe('a/b/c.txt');
    expect(leaf.isPrefix).toBe(false);
  });
});

describe('countObjects', () => {
  it('counts object keys and ignores folder markers', () => {
    expect(countObjects(sampleKeys)).toBe(5);
    expect(countObjects(['logs/', 'logs/today.log'])).toBe(1);
  });
});

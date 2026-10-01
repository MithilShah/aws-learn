/**
 * Logic behind <KeyPrefixExplorer>: given a flat list of Amazon S3 object
 * keys, group them into the prefix "tree" the S3 console would show, so a
 * reader can see that the folders are just shared key prefixes over a flat
 * namespace. Pure functions, so the browser script stays thin and the
 * grouping is unit-tested.
 *
 * S3 itself stores a flat list of keys; the delimiter ('/') and the idea of
 * a folder are a console convenience. This models exactly that: split each
 * key on the delimiter and fold common prefixes together.
 */

/** A node in the derived prefix tree. */
export interface PrefixNode {
  /** The last path segment, e.g. 'cat.jpg' or '2026'. */
  name: string;
  /** The full key (for objects) or prefix ending in the delimiter (for folders). */
  path: string;
  /** True when this node is a shared prefix (a "folder"), false for an object. */
  isPrefix: boolean;
  /** Child nodes, prefixes first then objects, each sorted by name. */
  children: PrefixNode[];
}

/**
 * Build the prefix tree the console would display for a set of object keys.
 * `delimiter` defaults to '/', matching the S3 console.
 *
 * Keys are treated as literal names: a key ending in the delimiter (e.g.
 * 'logs/') is an explicit empty "folder" marker and contributes a prefix
 * with no object leaf.
 */
export function buildPrefixTree(keys: readonly string[], delimiter = '/'): PrefixNode[] {
  const root: PrefixNode = { name: '', path: '', isPrefix: true, children: [] };

  for (const key of keys) {
    const segments = key.split(delimiter);
    let node = root;
    let prefix = '';

    segments.forEach((segment, i) => {
      const isLast = i === segments.length - 1;
      // A trailing delimiter yields a final empty segment: that's a folder
      // marker, not an object, so skip creating an object leaf for it.
      if (isLast && segment === '') return;

      prefix += segment + (isLast ? '' : delimiter);
      const isPrefix = !isLast;
      let child = node.children.find((c) => c.name === segment && c.isPrefix === isPrefix);
      if (!child) {
        child = { name: segment, path: prefix, isPrefix, children: [] };
        node.children.push(child);
      }
      node = child;
    });
  }

  sortTree(root);
  return root.children;
}

/** Sort each level: prefixes (folders) first, then objects, each A→Z. */
function sortTree(node: PrefixNode): void {
  node.children.sort((a, b) => {
    if (a.isPrefix !== b.isPrefix) return a.isPrefix ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  for (const child of node.children) sortTree(child);
}

/** Count the object leaves (not prefixes) in a set of keys. */
export function countObjects(keys: readonly string[], delimiter = '/'): number {
  return keys.filter((k) => !k.endsWith(delimiter)).length;
}

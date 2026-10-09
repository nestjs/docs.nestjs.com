import { Processor } from 'dgeni';
import { PUBLIC_BY_DEFAULT_DIRS } from '../config';
import { Doc } from './interfaces';

const hasTag = (doc: Doc, name: string) =>
  !!(doc.tags?.tags || []).find((tag) => tag.tagName === name);

// A doc is public when it is not `@internal` and either its package is
// public-by-default (see config) or it is explicitly tagged `@publicApi`.
const isPublic = (doc: Doc) => {
  if (hasTag(doc, 'internal')) return false;
  const file = doc.fileInfo?.projectRelativePath ?? '';
  return (
    PUBLIC_BY_DEFAULT_DIRS.some((dir) => file.startsWith(dir + '/')) ||
    hasTag(doc, 'publicApi')
  );
};

class MarkPrivateDocs implements Processor {
  $runAfter = ['extra-docs-added'];
  $runBefore = ['computing-paths'];
  $process(docs: Doc[]) {
    docs
      .filter((doc) => doc.docType !== 'package' && !isPublic(doc))
      .forEach((doc) => (doc.privateExport = true));
  }
}

export function markPrivateDocs() {
  return new MarkPrivateDocs();
}

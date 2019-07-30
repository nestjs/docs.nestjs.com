import { Processor } from 'dgeni';
import { Doc } from './interfaces';

class MarkPrivateDocs implements Processor {
  $runAfter = ['extra-docs-added'];
  $runBefore = ['computing-paths'];
  $process(docs: Doc[]) {
    docs
      .filter(
        doc =>
          !(doc.tags.tags || []).find(tag => tag.tagName === 'publicApi') &&
          doc.docType !== 'package'
      )
      .forEach(doc => (doc.privateExport = true));
  }
}

export function markPrivateDocs() {
  return new MarkPrivateDocs();
}

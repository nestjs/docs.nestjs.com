import { join } from 'path';
import { Processor } from 'dgeni';
import { Doc } from './interfaces';

class ProcessDecorators implements Processor {
  constructor() {}
  $runAfter = ['processing-docs'];
  $runBefore = ['docs-processed'];
  $process(docs: Doc[]) {
    docs.forEach((doc, index) => {
      if (doc.fileInfo.baseName.endsWith('decorator')) {
        if (doc.docType === 'function') {
          doc.docType = 'decorator';
          doc.template = join(
            __dirname,
            '../templates/decorator.template.html'
          );
        }
      }
    });
  }
}

export function processDecorators() {
  return new ProcessDecorators();
}
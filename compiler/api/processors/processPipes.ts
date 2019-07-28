import { Processor } from 'dgeni';
import { Doc } from './interfaces';
import { join } from 'path';

class ProcessPipes implements Processor {
  constructor() {}
  $runAfter = ['processing-docs'];
  $runBefore = ['docs-processed', 'extractDecoratedClasses'];
  $process(docs: Doc[]) {
    docs.forEach((doc) => {
      if (doc.fileInfo.baseName.endsWith('pipe')) {
        if (doc.docType === 'class') {
          doc.docType = 'pipe';
          doc.template = join(
            __dirname,
            '../templates/pipe.template.html'
          );
        }
      }
    });
  }
}

export function processPipes() {
  return new ProcessPipes();
}

import { Processor } from 'dgeni';
import { join } from 'path';

import { Document } from '../../shared';
import { SRC_PATH } from '../../config';

export class ComputeOutputPathProcessor implements Processor {
  $runBefore = ['writeFilesProcessor'];
  $process(docs: Document[]) {
    docs.forEach(doc => {
      if (doc.docType === 'content' || doc.docType === 'who-uses') {
        const filePath = doc.fileInfo.projectRelativePath;
        const distPath = filePath.slice(
          'content'.length + 1,
          filePath.length - 3 // strip extension
        );

        const pathSegments = distPath.split('/');
        const distFilename =
          pathSegments[pathSegments.length - 1] + '.component.html';

        doc.outputPath = join(
          SRC_PATH,
          '/app/homepage/pages',
          distPath,
          distFilename
        );
      }
    });
  }
}

export function computeOutputPathProcessor() {
  return new ComputeOutputPathProcessor();
}

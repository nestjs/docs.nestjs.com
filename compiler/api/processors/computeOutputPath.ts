import { Processor, DocCollection } from 'dgeni';
import { DOC_PATH_PREFIX } from '../config';
import { Doc, PackageDoc } from './interfaces';

class ComputeOutputPath implements Processor {
  $runAfter = ['processPackages'];
  $runBefore = ['generateApiListDoc'];
  $process(docs: Doc[]) {
    docs.forEach((doc: PackageDoc) => {
      if (doc.docType === 'package') {
        doc.outputPath = `${doc.name}.html`;
        doc.path = `${DOC_PATH_PREFIX}/${doc.name}`;
        doc.exports = (doc.exports || []).map(item => {
          return {
            ...item,
            outputPath: `${doc.name}/${item.name}.html`,
            path: `${DOC_PATH_PREFIX}/${doc.name}/${item.name}`
          };
        });
      } else if (doc.moduleDoc) {
        // All other docs except special ones like api-list.json
        doc.outputPath = `${doc.moduleDoc.name}/${doc.name}.html`;
        doc.path = `${DOC_PATH_PREFIX}/${doc.moduleDoc.name}/${doc.name}`;
      }
    });
  }
}

export function computeOutputPath() {
   return new ComputeOutputPath();
}

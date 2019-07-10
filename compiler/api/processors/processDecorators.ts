import { byId } from '../util/byId';
import { join } from 'path';

module.exports = function processDecorators(log: any, createDocMessage: any) {
  return {
    docTypes: [],
    $runAfter: ['processing-docs'],
    $runBefore: ['docs-processed'],
    $process(docs: any[]) {
      docs.forEach((doc, index) => {
        if (doc.fileInfo.baseName.endsWith('decorator')) {
          if (doc.docType === 'function') {
            doc.docType = 'decorator';
            doc.template = join(__dirname, '../templates/decorator.template.html');
          }
        }
      });
    }
  };
};

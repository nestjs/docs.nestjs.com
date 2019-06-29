import { byId } from '../util/byId';

module.exports = function processDecorators() {
  return {
    docTypes: [],
    $runAfter: ['processing-docs'],
    $runBefore: ['docs-processed'],
    $process(docs: any[]) {
      docs.forEach((doc, index) => {
        if (
          doc.fileInfo.baseName.endsWith('decorator') &&
          (doc.docType === 'function' || doc.docType === 'const')
        ) {
          doc.docType = 'decorator';
          doc.template = 'decorator.template.html';
        }
      });
    }
  };
};

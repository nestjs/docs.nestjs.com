import { byId } from '../util/byId';

module.exports = function processPackages() {
  return {
    docTypes: [],
    $runAfter: ['parseTagsProcessor', 'extractDecoratedClasses'],
    $runBefore: ['rendering-docs'],
    $process(docs: any[]) {
      docs.forEach((doc, index) => {
        if (doc.docType === 'module') {
          // Convert the doc type from 'module' to 'package'
          doc.docType = 'package';
          // The name is actually the full id
          doc.name = `@nestjs/${doc.id}`;

          if (doc.exports) {
            const publicExports = doc.exports.filter(doc => !doc.privateExport);
            doc.modules = publicExports.filter(doc => doc.docType === 'nestmodule').sort(byId);
            doc.classes = publicExports.filter(doc => doc.docType === 'class').sort(byId);
            doc.injectables = publicExports.filter(doc => doc.docType === 'injectable').sort(byId);
            doc.decorators = publicExports.filter(doc => doc.docType === 'decorator').sort(byId);
            doc.functions = publicExports.filter(doc => doc.docType === 'function').sort(byId);
            doc.structures = publicExports.filter(doc => doc.docType === 'enum' || doc.docType === 'interface').sort(byId);
            doc.pipes = publicExports.filter(doc => doc.docType === 'pipe').sort(byId);
            doc.types = publicExports.filter(doc => doc.docType === 'type-alias' || doc.docType === 'const').sort(byId);
          }
        }
      });
    }
  };
};

import { byId } from '../util/byId';

function getPackageName(packageDoc) {
  const idParts = packageDoc.id.split('/').filter(p => p !== 'lib' && p !== 'src');
  return idParts[idParts.length - 1].toLowerCase();
}

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
          doc.name = getPackageName(doc);

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

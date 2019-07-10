import { byId } from '../util/byId';
import { dirname } from 'canonical-path';

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
      const packageContentFiles = {};

      docs = docs.filter(doc => {
        if (doc.docType === 'package-content') {
          packageContentFiles[dirname(doc.fileInfo.filePath)] = doc;
          return false;
        } else {
          return true;
        }
      });


      docs.forEach((doc, index) => {
        if (doc.docType === 'module') {
          // Convert the doc type from 'module' to 'package'
          doc.docType = 'package';
          doc.name = getPackageName(doc);

          if (doc.exports) {
            const publicExports = doc.exports.filter(doc => !doc.privateExport);
            doc.decorators = publicExports.filter(doc => doc.docType === 'decorator').sort(byId);
            doc.modules = publicExports.filter(doc => doc.docType === 'nestmodule').sort(byId);
            doc.classes = publicExports.filter(doc => doc.docType === 'class').sort(byId);
            doc.injectables = publicExports.filter(doc => doc.docType === 'injectable').sort(byId);
            doc.decorators = publicExports.filter(doc => doc.docType === 'decorator').sort(byId);
            doc.functions = publicExports.filter(doc => doc.docType === 'function').sort(byId);
            doc.structures = publicExports.filter(doc => doc.docType === 'enum' || doc.docType === 'interface').sort(byId);
            doc.pipes = publicExports.filter(doc => doc.docType === 'pipe').sort(byId);
            doc.types = publicExports.filter(doc => doc.docType === 'type-alias' || doc.docType === 'const').sort(byId);
          }

          const readmeDoc = packageContentFiles[dirname(doc.fileInfo.filePath)];
          if (readmeDoc) {
            doc.shortDescription = readmeDoc.shortDescription;
            doc.description = readmeDoc.description;
            doc.see = readmeDoc.see;
            doc.fileInfo = readmeDoc.fileInfo;
          }

        }
      });
    }
  };
};

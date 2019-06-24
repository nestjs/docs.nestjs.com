import { byId } from '../util/byId';

const exportDocTypes = ['injectable'];

module.exports = function processModuleDocs(
  getDocFromAlias,
  createDocMessage,
  log
) {
  return {
    $runAfter: ['extractDecoratedClasses', 'computeIdsProcessor'],
    $runBefore: ['renderDocsProcessor'],
    $process(docs) {
      // Match all the injectables to their module
      const errors = [];
      docs.forEach(doc => {
        if (doc.publicApi !== '') {
          return;
        }
        if (exportDocTypes.indexOf(doc.docType) !== -1) {
          if (!doc.modules || doc.modules.length === 0) {
            errors.push(
              createDocMessage(
                `"${doc.id}" has no @module tag. Docs of type "${
                  doc.docType
                }" must have this tag.`,
                doc
              )
            );
            return;
          }

          doc.modules.forEach((nestModule: string, index: number) => {
            const nestModuleDocs = getDocFromAlias(nestModule, doc);

            if (nestModuleDocs.length === 0) {
              errors.push(
                createDocMessage(
                  `"@module ${nestModule}" does not match a public Module`,
                  doc
                )
              );
              return;
            }

            if (nestModuleDocs.length > 1) {
              errors.push(
                createDocMessage(
                  `"@module ${nestModule}" is ambiguous. Matches: ${nestModuleDocs
                    .map(d => d.id)
                    .join(', ')}`,
                  doc
                )
              );
              return;
            }

            const nestModuleDoc = nestModuleDocs[0];
            const containerName = getContainerName(doc.docType);
            const container = (nestModuleDoc[containerName] =
              nestModuleDoc[containerName] || []);
            container.push(doc);

            doc.modules[index] = nestModuleDoc;
          });
        }
      });

      if (errors.length) {
        errors.forEach(error => log.error(error));
        throw new Error('Failed to process nestModule relationships.');
      }

      docs.forEach(doc => {
        if (doc.docType === 'nestmodule') {
          Object.keys(doc.nestmoduleoptions).forEach(key => {
            const value = doc.nestmoduleoptions[key];
            if (value && !Array.isArray(value)) {
              doc.nestmoduleoptions[key] = [value];
            }
          });
          exportDocTypes.forEach(type => {
            const containerName = getContainerName(type);
            const container = doc[containerName];
            if (container) {
              container.sort(byId);
            }
          });
        }
      });
    }
  };
};

function getContainerName(docType) {
  return docType + 's';
}

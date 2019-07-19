import { byId } from '../util/byId';
import { Processor } from 'dgeni';
import { InjectableDoc, NestModuleDoc, Logger, CreateDocMessage } from './interfaces';

function getContainerName(docType) {
  return docType + 's';
}

export class ProcessModuleDocs implements Processor {
  constructor(
    private getDocFromAlias: any,
    private createDocMessage: CreateDocMessage,
    private log: Logger
  ) {}
  private exportDocTypes = ['injectable'];
  $runAfter = ['extractDecoratedClasses', 'computeIdsProcessor'];
  $runBefore = ['renderDocsProcessor'];
  $process(docs: InjectableDoc[]) {
    // Match all the injectables to their module
    const errors = [];
    docs.forEach(doc => {
      if (doc.publicApi !== '') {
        return;
      }
      if (this.exportDocTypes.indexOf(doc.docType) !== -1) {
        if (!doc.modules || doc.modules.length === 0) {
          errors.push(
            this.createDocMessage(
              `"${doc.id}" has no @module tag. Docs of type "${
                doc.docType
              }" must have this tag.`,
              doc
            )
          );
          return;
        }

        doc.modules.forEach((nestModule: string, index: number) => {
          const nestModuleDocs = this.getDocFromAlias(nestModule, doc);

          if (nestModuleDocs.length === 0) {
            errors.push(
              this.createDocMessage(
                `"@module ${nestModule}" does not match a public Module`,
                doc
              )
            );
            return;
          }

          if (nestModuleDocs.length > 1) {
            errors.push(
              this.createDocMessage(
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
      errors.forEach(error => this.log.error(error));
      throw new Error('Failed to process nestModule relationships.');
    }

    docs.forEach(d => {
      if (d.docType === 'nestmodule') {
        const doc = (d as unknown) as NestModuleDoc;
        Object.keys(doc.nestmoduleoptions).forEach(key => {
          const value = doc.nestmoduleoptions[key];
          if (value && !Array.isArray(value)) {
            doc.nestmoduleoptions[key] = [value];
          }
        });
        this.exportDocTypes.forEach(type => {
          const containerName = getContainerName(type);
          const container = doc[containerName];
          if (container) {
            container.sort(byId);
          }
        });
      }
    });
  }
}

export function processModuleDocs(
  getDocFromAlias: any,
  createDocMessage: CreateDocMessage,
  log: Logger
) {
  return new ProcessModuleDocs(getDocFromAlias, createDocMessage, log);
}

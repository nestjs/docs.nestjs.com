import { Processor, DocCollection } from 'dgeni';
import { CreateDocMessage, DgeniLogger } from '../../shared';

/**
 * Converts doc types set by the `docTypes` property to JSON documents.
 * A document requires `doc.renderContent` and `doc.title` or `doc.name`
 * property.  
 */
export class ConvertToJsonProcessor implements Processor {
  constructor(private log: DgeniLogger, private createDocMessage: CreateDocMessage) {}
  $runAfter = ['postProcessHtml'];
  $runBefore = ['writeFilesProcessor'];
  docTypes = [];
  $process(docs: DocCollection) {
    const docTypes = this.docTypes;
    docs.forEach((doc: any) => {
      if (docTypes.includes(doc.docType)) {
        let contents = doc.renderedContent || '';

        let title = doc.title;

        if (title === undefined) {
          title = doc.name;
        }

        // If there is still no title then log a warning
        if (title === undefined) {
          title = '';
          this.log.warn(this.createDocMessage('Title property expected', doc));
        }

        doc.renderedContent = JSON.stringify(
          { id: doc.path, title, contents },
          null,
          2
        );
      }
    });
  }
}

export function convertToJsonProcessor(log: any, createDocMessage: any) {
  return new ConvertToJsonProcessor(log, createDocMessage);
}

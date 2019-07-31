import { Processor, DocCollection } from 'dgeni';

/**
 * Extracts the title of a content file.
 * This processor assumes that the first line of the
 * content includes the title. 
 */
export class ExtractContentTitleProcessor implements Processor {
  $runAfter = ['renderDocsProcessor'];
  $runBefore = ['convertToJsonProcessor'];
  $process(docs: DocCollection) {
    docs.forEach(doc => {
      if (doc.docType === 'content') {
        try {
          const firstLine: string = doc.content.split('\n')[0];
          const title = firstLine.replace(/#/g, '').trim();
          doc.title = title;
        } catch (ex) {
          // We do not care if the title does not exist here
          // convertToJson will complain later in case the title
          // does not exist
        }
      }
    });
  }
}

export function extractContentTitleProcessor() {
  return new ExtractContentTitleProcessor();
}

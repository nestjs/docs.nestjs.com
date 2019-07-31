import { Processor } from 'dgeni';
import { Document } from '../../shared';

export class ComputeWhoUsesProcessor implements Processor {
  $runBefore = ['computePathsProcessor'];
  $runAfter = ['readFilesProcessor'];
  $process(docs: Document[]) {
    let whoUsesJson;
    docs.forEach((doc, index) => {
      if (doc.docType === 'who-uses-json') {
        whoUsesJson = doc.data;
        docs.splice(index, 1);
      }
    });
    docs.forEach(doc => {
      if (doc.docType === 'who-uses') {
        doc.id = 'who-uses';
        doc.whoUses = whoUsesJson;
      }
    });
  }
}

export function computeWhoUsesProcessor() {
  return new ComputeWhoUsesProcessor();
}

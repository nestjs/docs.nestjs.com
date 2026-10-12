import { Processor } from 'dgeni';
import { Doc } from './interfaces';

class ComputeStability implements Processor {
  docTypes: string[] = [];
  $runAfter: ['tags-extracted'];
  $runBefore: ['rendering-docs'];
  $process(docs) {
    docs.forEach((doc: Doc) => {
      if (
        this.docTypes.indexOf(doc.docType) !== -1 &&
        doc.deprecated === undefined &&
        doc.stable === undefined
      ) {
        doc.stable = true;
      }
    });
  }
}

export function computeStability() {
  return new ComputeStability();
}

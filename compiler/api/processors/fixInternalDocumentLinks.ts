import { Processor } from 'dgeni';
import { RenderedDoc } from './interfaces';

class FixInternalDocumentLinks implements Processor {
  INTERNAL_LINK = /(<a [^>]*href=")(#[^"]*)/g;
  $runAfter =  ['inlineTagProcessor'];
  $runBefore = ['writeFilesProcessor'];

  $process(docs: RenderedDoc[]): void {
    docs.forEach(doc => {
      if (!doc.renderedContent) {
        return;
      }
      doc.renderedContent = doc.renderedContent.replace(
        this.INTERNAL_LINK,
        (_, pre, hash) => pre + doc.path + hash
      );
    });
  }
}

export function fixInternalDocumentLinks() {
  return new FixInternalDocumentLinks();
}

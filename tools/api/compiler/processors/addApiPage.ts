import { Processor } from 'dgeni';
import { Doc } from './interfaces';

class AddApiPage implements Processor {
  $runBefore = ['checkAnchorLinksProcessor'];
  $process(docs: Doc[]) {
    // Adds API page, so '/api' is not seen as invalid link in checkAnchorLinksProcessor
    docs.push({
      name: 'API',
      path: '/api',
      outputPath: '/api/index.html',
      docType: 'blank',
    });
  }
}

export function addApiPage() {
  return new AddApiPage();
}

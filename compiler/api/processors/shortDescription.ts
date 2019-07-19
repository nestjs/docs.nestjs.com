import { Processor } from 'dgeni';
import { Doc } from './interfaces';

/**
 * Split the description (of selected docs) into:
 *`shortDescription`: the first paragraph
 *`description`: the rest of the paragraphs
 */
class ShortDescription implements Processor {
  $runAfter = ['tags-extracted'];
  $runBefore = ['processing-docs'];
  $process(docs: Doc[]) {
    docs.forEach(doc => {
      if (doc.description !== undefined) {
        const description = doc.description.trim();
        const endOfParagraph = description.search(/\n\s*\n/);
        if (endOfParagraph === -1) {
          doc.shortDescription = description;
          doc.description = '';
        } else {
          doc.shortDescription = description.substr(0, endOfParagraph).trim();
          doc.description = description.substr(endOfParagraph).trim();
        }
      }
    });
  }
}

export function shortDescription() {
  return new ShortDescription();
}

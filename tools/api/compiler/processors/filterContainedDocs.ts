import { Processor } from 'dgeni';
import { Doc } from './interfaces';

const docTypes = [
  'member',
  'function-overload',
  'get-accessor-info',
  'set-accessor-info',
  'parameter',
  'package-content'
];

/**
 * Remove docs that are contained in (owned by) another doc
 * so that they don't get rendered as files in themselves.
 */
class FilterContainedDocs implements Processor {
  $runAfter = ['extra-docs-added'];
  $runBefore = ['computing-paths', 'computeIdsProcessor'];
  $process(docs: Doc[]) {
    return docs.filter(doc => docTypes.indexOf(doc.docType) === -1);
  }
}

export function filterContainedDocs() {
  return new FilterContainedDocs();
}
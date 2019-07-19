import { Processor } from 'dgeni';
import { Doc } from './interfaces';

export class ComputeApiBreadCrumbs implements Processor {
  constructor(private API_DOC_TYPES_TO_RENDER: string[]) {}
  $runAfter = ['paths-computed', 'computeOutputPath'];
  $runBefore = ['rendering-docs'];
  $process(docs: Doc[]) {
    // Compute the breadcrumb for each doc by processing its containers
    docs.forEach(doc => {
      if (this.API_DOC_TYPES_TO_RENDER.indexOf(doc.docType) !== -1) {
        doc.breadCrumbs = [];
        doc.breadCrumbs.push({ text: 'API', path: '/api' });
        if (doc.moduleDoc) {
          doc.breadCrumbs.push({
            text: '@nestjs/' + doc.moduleDoc.name,
            path: doc.moduleDoc.path
          });
        }
        doc.breadCrumbs.push({ text: doc.name, path: doc.path });
      }
    });
  }
}

export function computeApiBreadCrumbs(API_DOC_TYPES_TO_RENDER: string[]) {
  return new ComputeApiBreadCrumbs(API_DOC_TYPES_TO_RENDER);
}

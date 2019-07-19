import { Processor } from 'dgeni';
import { Doc } from './interfaces';

class ExtractDecoratedClasses implements Processor {
  decoratorTypes = ['Injectable', 'Pipe', 'Module'];
  $runAfter = ['processing-docs'];
  $runBefore = ['docs-processed'];
  $process(docs: Doc[]) {
    docs.forEach(doc =>
      (doc.decorators || []).forEach(decorator => {
        if (this.decoratorTypes.indexOf(decorator.name) !== -1) {
          const docType = decorator.name.toLowerCase();
          // Cannot use module type, because that is already reserved
          doc.docType = docType === 'module' ? 'nestmodule' : docType;
          doc.path = `partials/modules/${doc.id}/index.html`;
          doc.outputPath = `partials/modules/${doc.id}/index.html`;
          doc[doc.docType + 'options'] = decorator.argumentInfo[0];
          doc.template = `${doc.docType}.template.html`;
        }
      })
    );
  }
}

export function extractDecoratedClasses() {
  return new ExtractDecoratedClasses();
}
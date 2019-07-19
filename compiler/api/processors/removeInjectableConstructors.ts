import { Processor } from 'dgeni';
import { Doc } from './interfaces';

class RemoveInjectableConstructors implements Processor {
  $runAfter = ['processing-docs', 'shortDescription'];
  $runBefore = ['docs-processed'];
  injectableDecorators = ['Injectable', 'Module'];
  $process(docs: Doc[]) {
    docs.forEach(doc => {
      if (
        doc.constructorDoc &&
        doc.decorators &&
        doc.decorators.some(
          decorator => this.injectableDecorators.indexOf(decorator.name) !== -1
        )
      ) {
        delete doc.constructorDoc;
      }
    });
  }
}

export function removeInjectableConstructors() {
  return new RemoveInjectableConstructors();
}
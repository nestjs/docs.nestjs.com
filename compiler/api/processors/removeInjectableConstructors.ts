module.exports = function removeInjectableConstructors() {
  return {
    $runAfter: ['processing-docs', 'splitDescription'],
    $runBefore: ['docs-processed'],
    injectableDecorators: ['Injectable', 'Module'],
    $process(docs) {
      docs.forEach(doc => {
        if (
          doc.constructorDoc &&
          doc.decorators &&
          doc.decorators.some(decorator => this.injectableDecorators.indexOf(decorator.name) !== -1)) {
          delete doc.constructorDoc;
        }
      });
    }
  };
};

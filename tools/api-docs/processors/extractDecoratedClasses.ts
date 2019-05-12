const decoratorTypes = ['Injectable', 'Pipe', 'Module'];

module.exports = function extractDecoratedClasses() {
  return {
    $runAfter: ['processing-docs'],
    $runBefore: ['docs-processed'],
    $process: docs => {
      docs.forEach(doc =>
        (doc.decorators || []).forEach(decorator => {
          if (decoratorTypes.indexOf(decorator.name) !== -1) {
            const docType = decorator.name.toLowerCase();
            // Cannot use module type, because that is already reserved
            doc.docType = docType === 'module' ? 'nestmodule' : docType;
            console.log(doc);
            doc.path = `partials/modules/${doc.id}/index.html`;
            doc.outputPath = `partials/modules/${doc.id}/index.html`;
            doc[doc.docType + 'options'] = decorator.argumentInfo[0];
            doc.template = `${doc.docType}.template.html`;
          }
        })
      );
    }
  };
};

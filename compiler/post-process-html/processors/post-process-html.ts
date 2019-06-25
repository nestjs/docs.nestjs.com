const rehype = require('rehype');

module.exports = function postProcessHtml(log, createDocMessage) {
  return {
    $runAfter: ['docs-rendered'],
    $runBefore: ['writing-files'],
    docTypes: [],
    plugins: [],
    $process(docs) {
      const engine = rehype()
            .data('settings', { fragment: true });

      this.plugins.forEach(plugin => engine.use(plugin));

      let vFile;

      docs
        .filter(doc => this.docTypes.indexOf(doc.docType) !== -1)
        .forEach(doc => {
          try {
            vFile = engine.processSync(doc.renderedContent);
            doc.renderedContent = vFile.contents;
            vFile.messages.forEach(m => {
              log.warn(createDocMessage(m.message, doc));
            });
            doc.vFile = vFile;
          } catch(e) {
            throw new Error(createDocMessage(e.message, doc));
          }
        });
    }
  };
};

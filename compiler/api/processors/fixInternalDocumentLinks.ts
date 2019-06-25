module.exports = function fixInternalDocumentLinks() {

  const INTERNAL_LINK = /(<a [^>]*href=")(#[^"]*)/g;

  return {
    $runAfter: ['inlineTagProcessor'],
    $runBefore: ['writeFilesProcessor'],
    $process: function(docs) {
      docs.forEach(doc => {
        doc.renderedContent = doc.renderedContent.replace(INTERNAL_LINK, (_, pre, hash) => {
          return pre + doc.path + hash;
        });
      });
    }
  };
};
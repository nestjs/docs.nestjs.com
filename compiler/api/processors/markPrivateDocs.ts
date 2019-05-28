module.exports = function markPrivateDocs() {
  return {
    $runAfter: ['extra-docs-added'],
    $runBefore: ['computing-paths'],
    $process: docs =>
      docs
        .filter(
          doc =>
            !((doc.tags.tags || []).find(tag => tag.tagName === 'publicApi')) &&
            doc.docType !== 'package'
        )
        .forEach(doc => (doc.privateExport = true))
  };
};

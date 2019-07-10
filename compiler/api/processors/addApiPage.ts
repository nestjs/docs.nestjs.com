// Adds API page, so '/api' is not seen as invalid link in checkAnchorLinksProcessor
module.exports = function addApiPage() {
  return {
    $runBefore: ['checkAnchorLinksProcessor'],
    $process(docs) {
      docs.push({
        name: 'API',
        path: '/api',
        outputPath: '/api/index.html',
        docType: 'blank',
      });
    }
  };
};

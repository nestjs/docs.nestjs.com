module.exports = function test() {
  return {
    docTypes: [],
    $runAfter: ['processClassLikeMembers'],
    $runBefore: ['renderDocsProcessor'],
    $process(docs: any[]) {
      // console.log(docs.find(doc => doc.docType === 'class').methods[0]);
    }
  };
};

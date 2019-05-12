module.exports = function test() {
  return {
    docTypes: [],
    $runAfter: ['processPackages'],
    $process(docs: any[]) {
        // console.log(docs[0].classes);
    }
  };
};

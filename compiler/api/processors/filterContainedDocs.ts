const docTypes = [
  'member',
  'function-overload',
  'get-accessor-info',
  'set-accessor-info',
  'parameter'
];

/**
 * Remove docs that are contained in (owned by) another doc
 * so that they don't get rendered as files in themselves.
 */
module.exports = function filterContainedDocs() {
  return {
    $runAfter: ['extra-docs-added'],
    $runBefore: ['computing-paths'],
    $process: docs =>
      docs.filter(doc => docTypes.indexOf(doc.docType) === -1)
  };
};

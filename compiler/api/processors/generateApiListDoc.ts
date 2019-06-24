module.exports = function generateApiListDoc() {
  return {
    $runAfter: ['extra-docs-added', 'processPackages'],
    $runBefore: ['rendering-docs'],
    outputFolder: '.',
    $validate: { outputFolder: { presence: true } },
    $process: function(docs) {
      docs.push({
        docType: 'api-list-data',
        template: 'json-doc.template.json',
        path: this.outputFolder + '/api-list.json',
        outputPath: this.outputFolder + '/api-list.json',
        data: docs.filter(doc => doc.docType === 'package').map(getPackageInfo)
      });
    }
  };
};


function getPackageInfo(packageDoc) {
  return {
    name: packageDoc.id,
    title: packageDoc.name,
    path: packageDoc.path,
    items: (packageDoc.exports || [])
      .filter(doc => !doc.privateExport)
      .map(getExportInfo)
      .sort((a, b) => (a.name === b.name ? 0 : a.name > b.name ? 1 : -1))
  };
}

function getExportInfo(exportDoc) {
  return {
    name: exportDoc.name.toLowerCase(),
    title: exportDoc.name,
    path: exportDoc.path,
    docType: getDocType(exportDoc)
  };
}

function getDocType(doc) {
  // We map `let` and `var` types to `const`
  if (['let', 'var'].indexOf(doc.docType) !== -1) {
    return 'const';
  }
  return doc.docType;
}
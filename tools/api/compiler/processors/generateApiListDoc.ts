import { Processor } from 'dgeni';
import { ApiPackageItem, ApiExportItem, ApiListDoc } from './interfaces';
import { PACKAGES, PACKAGE_GROUPS } from '../config';

const entryDir = (path: string) => path.replace(/^\.\//, '').replace(/\/index\.ts$/, '');
const entryFor = (packageDoc) => PACKAGES.find((p) => entryDir(p.path) === packageDoc.id);

function getPackageInfo(packageDoc): ApiPackageItem {
  return {
    name: packageDoc.id,
    title: packageDoc.name,
    path: packageDoc.path,
    group: entryFor(packageDoc)?.group,
    items: (packageDoc.exports || [])
      .filter((doc) => !doc.privateExport)
      .map(getExportInfo)
      .sort((a, b) => (a.name === b.name ? 0 : a.name > b.name ? 1 : -1)),
  };
}

function getExportInfo(exportDoc): ApiExportItem {
  return {
    name: exportDoc.name.toLowerCase(),
    title: exportDoc.name,
    path: exportDoc.path,
    stability: getStability(exportDoc),
    docType: getDocType(exportDoc),
  };
}

function getDocType(doc): string {
  // We map `let` and `var` types to `const`
  if (['let', 'var'].indexOf(doc.docType) !== -1) {
    return 'const';
  }
  return doc.docType;
}

const stabilityProperties = ['stable', 'deprecated'];
function getStability(doc): string {
  return stabilityProperties.find((prop) => Object.hasOwn(doc, prop)) || '';
}

class GenerateApiListDoc implements Processor {
  $runAfter = ['extra-docs-added', 'processPackages'];
  $runBefore = ['rendering-docs'];
  outputFolder = '.';
  $validate = { outputFolder: { presence: true } };
  $process(docs: ApiListDoc[]) {
    docs.push({
      docType: 'api-list-data',
      template: 'json-doc.template.json',
      path: this.outputFolder + '/api-list.json',
      outputPath: this.outputFolder + '/api-list.json',
      // Grouped like the docs sidebar, config order within a group.
      data: docs
        .filter((doc) => doc.docType === 'package')
        .sort((a, b) => {
          const ea = entryFor(a), eb = entryFor(b);
          return (
            PACKAGE_GROUPS.indexOf(ea?.group) - PACKAGE_GROUPS.indexOf(eb?.group) ||
            PACKAGES.indexOf(ea) - PACKAGES.indexOf(eb)
          );
        })
        .map(getPackageInfo),
    });
  }
}

export function generateApiListDoc() {
  return new GenerateApiListDoc();
}

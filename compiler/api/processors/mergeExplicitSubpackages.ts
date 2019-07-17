import { Processor, Package, Module } from 'dgeni';
import { Doc, ModuleDoc } from './interfaces';

class MergeExplicitSubpackages implements Processor {
  $runAfter = ['parseTagsProcessor', 'extractDecoratedClasses'];
  $runBefore = ['processPackages'];

  $process(docs: Doc[]): void {
    const allPackages = docs.filter(
      doc => doc.docType === 'module'
    ) as ModuleDoc[];
    const subpackages = allPackages.reduce<ModuleDoc[]>(
      (prev, pkg) =>
        prev.concat(
          allPackages.filter(
            subpkg => subpkg.id.startsWith(pkg.id) && subpkg.id !== pkg.id
          )
        ),
      []
    );
    const subpackageIds = subpackages.map(subpkg => subpkg.id);
    const subPackageExports = subpackages.reduce(
      (prev, curr) => prev.concat(curr.exports),
      []
    );
    const subpackageExportIds = subPackageExports.map(doc => doc.id);

    const packages = allPackages.filter(pkg => !subpackageIds.includes(pkg.id));
    const packageIds = packages.map(pkg => pkg.id);

    docs.forEach((doc: Doc) => {
      if (packageIds.includes(doc.id)) {
        const subPackagesOfThatPkg = subpackages.filter(subpkg =>
          subpkg.id.startsWith(doc.id)
        );
        if (subPackagesOfThatPkg.length) {
          const exportedElements = subPackagesOfThatPkg.reduce(
            (exports: Doc[], subpkg: ModuleDoc) =>
              exports.concat(subpkg.exports),
            []
          );

          exportedElements.forEach(exportedElement => {
            if (
              !(doc as ModuleDoc).exports
                .map(e => e.name)
                .includes(exportedElement.name)
            ) {
              !(doc as ModuleDoc).exports.push(exportedElement);
            }
          });
        }
      }
      if (subpackageIds.includes(doc.id)) {
        (doc as Doc).docType = 'subpackage';
      }
      if (subpackageExportIds.includes(doc.id)) {
        const parentPackage = packages.find(pkg => doc.id.startsWith(pkg.id));
        doc.path = parentPackage.path + '/' + doc.name;
        doc.outputPath = parentPackage.outputPath.replace('index.html', '') + doc.name + '.html';
        doc.moduleDoc = parentPackage;
      }
    });
  }
}

export function mergeExplicitSubpackages() {
  return new MergeExplicitSubpackages();
}

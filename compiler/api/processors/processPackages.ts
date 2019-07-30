import { byId } from '../util/byId';
import { dirname } from 'canonical-path';
import { Processor } from 'dgeni';
import {
  ModuleDoc,
  PackageContentDoc,
  NestModuleDoc,
  InjectableDoc,
  TypeDoc,
  PipeDoc,
  StructureDoc,
  DecoratorDoc,
  FunctionDoc
} from './interfaces';

function getPackageName(packageDoc) {
  const idParts = packageDoc.id
    .split('/')
    .filter(p => p !== 'lib' && p !== 'src');
  return idParts[idParts.length - 1].toLowerCase();
}

class ProcessPackages implements Processor {
  $runAfter = ['parseTagsProcessor', 'extractDecoratedClasses'];
  $runBefore = ['rendering-docs'];
  $process(docs: ModuleDoc[]) {
    const packageContentFiles = {};

    docs = docs.filter(d => {
      const doc = (d as unknown) as PackageContentDoc;
      if (doc.docType === 'package-content') {
        packageContentFiles[dirname(doc.fileInfo.filePath)] = doc;
        return false;
      } else {
        return true;
      }
    });

    docs.forEach(doc => {
      if (doc.docType === 'module') {
        // Convert the doc type from 'module' to 'package'
        doc.docType = 'package';
        doc.name = getPackageName(doc);

        if (doc.exports) {
          const publicExports = doc.exports.filter(d => !d.privateExport);
          doc.decorators = publicExports
            .filter(d => d.docType === 'decorator')
            .sort(byId) as DecoratorDoc[];
          doc.modules = publicExports
            .filter(d => d.docType === 'nestmodule')
            .sort(byId) as NestModuleDoc[];
          doc.classes = publicExports
            .filter(d => d.docType === 'class')
            .sort(byId);
          doc.injectables = publicExports
            .filter(d => d.docType === 'injectable')
            .sort(byId) as InjectableDoc[];
          doc.decorators = publicExports
            .filter(d => d.docType === 'decorator')
            .sort(byId) as DecoratorDoc[];
          doc.functions = publicExports
            .filter(d => d.docType === 'function')
            .sort(byId) as FunctionDoc[];
          doc.structures = publicExports
            .filter(d => d.docType === 'enum' || d.docType === 'interface')
            .sort(byId) as StructureDoc[];
          doc.pipes = publicExports
            .filter(d => d.docType === 'pipe')
            .sort(byId) as PipeDoc[];
          doc.types = publicExports
            .filter(d => d.docType === 'type-alias' || d.docType === 'const')
            .sort(byId) as TypeDoc[];
        }

        const readmeDoc = packageContentFiles[dirname(doc.fileInfo.filePath)];
        if (readmeDoc) {
          doc.shortDescription = readmeDoc.shortDescription;
          doc.description = readmeDoc.description;
          doc.see = readmeDoc.see;
          doc.fileInfo = readmeDoc.fileInfo;
        }
      }
    });
  }
}

export function processPackages() {
  return new ProcessPackages();
}

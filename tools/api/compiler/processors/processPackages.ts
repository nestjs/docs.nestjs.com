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
  FunctionDoc,
  Logger,
} from './interfaces';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';

function getPackageName(packageDoc) {
  const idParts = packageDoc.id
    .split('/')
    .filter((p) => p !== 'lib' && p !== 'src');
  return idParts[idParts.length - 1].toLowerCase();
}

class ProcessPackages implements Processor {
  constructor(private log: Logger) {}
  $runAfter = ['parseTagsProcessor', 'extractDecoratedClasses'];
  $runBefore = ['rendering-docs'];
  $process(docs: ModuleDoc[]) {
    const packageContentFiles = {};
    const packageMap = {};

    docs = docs.filter((d) => {
      const doc = d as unknown as PackageContentDoc;
      if (doc.docType === 'package-content') {
        packageContentFiles[dirname(doc.fileInfo.filePath)] = doc;
        return false;
      } else {
        return true;
      }
    });

    docs.forEach((doc) => {
      if (doc.docType === 'module') {
        // Convert the doc type from 'module' to 'package'
        doc.docType = 'package';
        doc.name = getPackageName(doc);
        const sourcesDir = doc.fileInfo.projectRelativePath.split('/')[0];
        const folderPath = join(doc.fileInfo.basePath, sourcesDir);
        const gitFilePath = join(folderPath, '.git');

        let head = '';
        if (existsSync(join(gitFilePath, 'refs/heads/master'))) {
          head = readFileSync(join(gitFilePath, 'refs/heads/master'), 'utf8');
        } else if (existsSync(join(gitFilePath, 'refs/heads/main'))) {
          head = readFileSync(join(gitFilePath, 'refs/heads/main'), 'utf8');
        }

        let packageJson = null;
        if (existsSync(join(folderPath, 'package.json'))) {
          packageJson = JSON.parse(
            readFileSync(join(folderPath, 'package.json'), 'utf8')
          );
        }

        doc.gitSHA = head.trim().slice(0, 7);
        doc.packageJSON = packageJson;

        if (doc.exports) {
          const publicExports = doc.exports.filter((d) => !d.privateExport);
          if (publicExports.length === 0) {
            this.log.warn(
              `Package "${doc.id}" has no public exports: it will not show up in the API list. Add @publicApi tags or set publicByDefault on its repository in tools/api/packages.ts.`
            );
          }
          doc.decorators = publicExports
            .filter((d) => d.docType === 'decorator')
            .sort(byId) as DecoratorDoc[];
          doc.modules = publicExports
            .filter((d) => d.docType === 'nestmodule')
            .sort(byId) as NestModuleDoc[];
          doc.classes = publicExports
            .filter((d) => d.docType === 'class')
            .sort(byId);
          doc.injectables = publicExports
            .filter((d) => d.docType === 'injectable')
            .sort(byId) as InjectableDoc[];
          doc.decorators = publicExports
            .filter((d) => d.docType === 'decorator')
            .sort(byId) as DecoratorDoc[];
          doc.functions = publicExports
            .filter((d) => d.docType === 'function')
            .sort(byId) as FunctionDoc[];
          doc.structures = publicExports
            .filter((d) => d.docType === 'enum' || d.docType === 'interface')
            .sort(byId) as StructureDoc[];
          doc.pipes = publicExports
            .filter((d) => d.docType === 'pipe')
            .sort(byId) as PipeDoc[];
          doc.types = publicExports
            .filter((d) => d.docType === 'type-alias' || d.docType === 'const')
            .sort(byId) as TypeDoc[];
          if (doc.exports.every((doc) => !!doc.deprecated)) {
            doc.deprecated = 'all exports of this entry point are deprecated.';
          }
        }

        const readmeDoc = packageContentFiles[dirname(doc.fileInfo.filePath)];
        if (readmeDoc) {
          doc.shortDescription = readmeDoc.shortDescription;
          doc.description = readmeDoc.description;
          doc.see = readmeDoc.see;
          doc.fileInfo = readmeDoc.fileInfo;
        }

        // Update package deprecation status (compared to entry point status)
        Object.keys(packageMap).forEach((key) => {
          const pkg = packageMap[key];
          pkg.primary.packageDeprecated =
            pkg.primary.deprecated !== undefined &&
            pkg.secondary.every(
              (entryPoint) => entryPoint.deprecated !== undefined
            );
        });
      }
    });
  }
}

export function processPackages(log: Logger) {
  return new ProcessPackages(log);
}

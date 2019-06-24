import { Dgeni, Package } from 'dgeni';
import { resolve, relative } from 'path';
import { requireFolder } from './util';
import { PACKAGES_PATH, PROJECT_ROOT, OUTPUT_PATH } from './config';

import * as jsdocPackage from 'dgeni-packages/jsdoc';
import * as nunjucksPackage from 'dgeni-packages/nunjucks';
import * as typeScriptPackage from 'dgeni-packages/typescript';

function typeScriptConfiguration(readTypeScriptModules: any, tsParser: any) {
  // Tell TypeScript how to load modules that start with with `@nestjs`
  tsParser.options.paths = { '@nestjs/*': [PROJECT_ROOT + '/*'] };
  tsParser.options.baseUrl = '.';

  // API files are typescript
  readTypeScriptModules.basePath = PROJECT_ROOT;
  readTypeScriptModules.sourceFiles = PACKAGES_PATH;
}

function readFilesConfiguration(readFilesProcessor: any) {
  readFilesProcessor.$enabled = false;
  readFilesProcessor.basePath = PROJECT_ROOT;
}

function jsDocConfiguration(
  parseTagsProcessor: any,
  getInjectables: any,
  tsHost: any
) {
  // Load up all the tag definitions in the tag-defs folder
  parseTagsProcessor.tagDefinitions = parseTagsProcessor.tagDefinitions.concat(
    getInjectables(requireFolder(__dirname, './tag-defs'))
  );
  // We don't want license headers to be joined to the first API item's comment
  tsHost.concatMultipleLeadingComments = false;
}

function writeFilesConfiguration(writeFilesProcessor: any) {
  writeFilesProcessor.outputFolder = OUTPUT_PATH;
}

function templateFinderConfiguration(
  templateFinder: any,
  templateEngine: any,
  renderDocsProcessor: any,
  getInjectables: any
) {
  templateFinder.templateFolders.unshift(resolve(__dirname, 'templates'));
  templateFinder.templatePatterns = [
    '${ doc.template }',
    '${ doc.id }.${ doc.docType }.template.html',
    '${ doc.id }.template.html',
    '${ doc.docType }.template.html',
    '${ doc.id }.${ doc.docType }.template.js',
    '${ doc.id }.template.js',
    '${ doc.docType }.template.js',
    '${ doc.id }.${ doc.docType }.template.json',
    '${ doc.id }.template.json',
    '${ doc.docType }.template.json',
    'common.template.html'
  ];

  // Nunjucks and Angular conflict in their template bindings so change Nunjucks
  templateEngine.config.tags = { variableStart: '{$', variableEnd: '$}' };

  templateEngine.filters = templateEngine.filters.concat(
    getInjectables(requireFolder(__dirname, './rendering'))
  );

  // helpers are made available to the nunjucks templates
  renderDocsProcessor.helpers.relativePath = (from: string, to: string) =>
    relative(from, to);
}

const nestjs = new Package('nestjs', [
  jsdocPackage,
  nunjucksPackage,
  typeScriptPackage
])
  .factory(require('./readers/package-content'))
  .factory(require('./services/getDocFromAlias'))

  .processor(require('./processors/processPackages'))
  .processor(require('./processors/generateApiListDoc'))
  .processor(require('./processors/extractDecoratedClasses'))
  .processor(require('./processors/processClassLikeMembers'))
  .processor(require('./processors/filterContainedDocs'))
  .processor(require('./processors/markPrivateDocs'))
  .processor(require('./processors/shortDescription'))
  .processor(require('./processors/removeInjectableConstructors'))
  .processor(require('./processors/processModuleDocs'))
  .processor(require('./processors/computeOutputPath'))

  .config(typeScriptConfiguration)
  .config(readFilesConfiguration)
  .config(jsDocConfiguration)
  .config(writeFilesConfiguration)
  .config(templateFinderConfiguration);

new Dgeni([nestjs]).generate();

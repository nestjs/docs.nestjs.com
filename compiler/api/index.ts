import { Dgeni, Package } from 'dgeni';
import { resolve, relative } from 'path';
import { requireFolder } from './util';
import { PACKAGES_PATH, PROJECT_ROOT, OUTPUT_PATH } from './config';

import * as jsdocPackage from 'dgeni-packages/jsdoc';
import * as nunjucksPackage from 'dgeni-packages/nunjucks';
import * as typeScriptPackage from 'dgeni-packages/typescript';
import { postProcessHtmlPackage } from '../post-process-html';

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

function API_CONTAINED_DOC_TYPES() {
  return [
    'member',
    'function-overload',
    'get-accessor-info',
    'set-accessor-info',
    'parameter'
  ];
}
function API_DOC_TYPES_TO_RENDER(EXPORT_DOC_TYPES, API_CONTAINED_DOC_TYPES) {
  return EXPORT_DOC_TYPES.concat([
    'decorator',
    'nestmodule',
    'injectable',
    'pipe',
    'package'
  ]).filter(element => API_CONTAINED_DOC_TYPES.indexOf(element) === -1);
}

function API_DOC_TYPES(
  API_DOC_TYPES_TO_RENDER: string[],
  API_CONTAINED_DOC_TYPES: string[]
) {
  return API_DOC_TYPES_TO_RENDER;
}

function postProcessors(postProcessHtml: any, autoLinkCode: any, API_DOC_TYPES: string[], API_DOC_TYPES_TO_RENDER: string[]) {
  autoLinkCode.docTypes = API_DOC_TYPES;
  postProcessHtml.docTypes = API_DOC_TYPES_TO_RENDER;
  autoLinkCode.codeElements = ['code'];
  postProcessHtml.plugins = [
    require('./post-processors/autolink-headings'),
    autoLinkCode,
    require('./post-processors/codeFormatting'),
  ];
}

function templateFinderConfiguration(
  templateFinder: any,
  templateEngine: any,
  renderDocsProcessor: any,
  getInjectables: any,
  computePathsProcessor: any
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

  computePathsProcessor.pathTemplates.push({
    docTypes: ['decorator'],
    pathTemplate: 'decorator.template.html',
  });

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
  typeScriptPackage,
  postProcessHtmlPackage,
])
  .factory(require('./readers/package-content'))
  .factory(require('./services/getDocFromAlias'))
  .factory(require('./post-processors/auto-link-code'))
  .factory(API_CONTAINED_DOC_TYPES)
  .factory(API_DOC_TYPES_TO_RENDER)
  .factory(API_DOC_TYPES)

  .processor(require('./processors/processPackages'))
  .processor(require('./processors/generateApiListDoc'))
  .processor(require('./processors/extractDecoratedClasses'))
  .processor(require('./processors/processClassLikeMembers'))
  .processor(require('./processors/filterContainedDocs'))
  .processor(require('./processors/markPrivateDocs'))
  .processor(require('./processors/shortDescription'))
  .processor(require('./processors/removeInjectableConstructors'))
  .processor(require('./processors/processModuleDocs'))
  .processor(require('./processors/processDecorators'))
  .processor(require('./processors/computeOutputPath'))
  .processor(require('./processors/fixInternalDocumentLinks'))

  .config(typeScriptConfiguration)
  .config(readFilesConfiguration)
  .config(jsDocConfiguration)
  .config(writeFilesConfiguration)
  .config(postProcessors)
  .config(templateFinderConfiguration);

new Dgeni([nestjs]).generate();

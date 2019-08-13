import { Package } from 'dgeni';
import { relative } from 'path';

import * as nunjucksPackage from 'dgeni-packages/nunjucks';
import * as jsdocPackage from 'dgeni-packages/jsdoc';
import * as postProcessPackage from 'dgeni-packages/post-process-html';

import { PROJECT_ROOT, TEMPLATES_PATH, DOCS_OUTPUT_PATH } from '../config';
import { jsonFileReader, JsonFileReader } from './readers';
import { convertToJsonProcessor } from './processors';

export default new Package('nestjs-base', [
  jsdocPackage,
  nunjucksPackage,
  postProcessPackage
])
  .processor(convertToJsonProcessor)
  .factory(jsonFileReader)
  .config((readFilesProcessor: any, jsonFileReader: JsonFileReader) => {
    readFilesProcessor.fileReaders.push(jsonFileReader);
    readFilesProcessor.basePath = PROJECT_ROOT;
    readFilesProcessor.sourceFiles = [];
  })
  .config(writeFilesProcessor => {
    writeFilesProcessor.outputFolder = DOCS_OUTPUT_PATH;
  })
  .config(
    (renderDocsProcessor: any, templateFinder: any, templateEngine: any) => {
      // Where to find the templates for the doc rendering
      templateFinder.templateFolders = [TEMPLATES_PATH];

      // Standard patterns for matching docs to templates
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

      templateEngine.config.tags = { variableStart: '{$', variableEnd: '$}' };

      // helpers are made available to the nunjucks templates
      renderDocsProcessor.helpers.relativePath = (from, to) =>
        relative(from, to);
    }
  );

export * from './processors';
export * from './readers';

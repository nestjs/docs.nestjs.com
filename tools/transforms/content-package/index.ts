import { Package } from 'dgeni';
import { Document } from '../shared';
import {
  computeOutputPathProcessor,
  computeWhoUsesProcessor,
  extractContentTitleProcessor,
  outputCleanMarkdownProcessor,
} from './processors';
import { ContentFileReader, contentFileReader } from './readers';
import { cleanMarkdownNunjucksFilter } from './rendering/filters/base64';
import { nestjsMarkedNunjucksFilter } from './rendering/filters/nestjs-marked';
import { nestjsMarkedNunjucksTag } from './rendering/tags/nestjs-marked';
import { renderNestJSMarkdown } from './services';

export default new Package('content', [])
  .factory(contentFileReader)
  .factory(renderNestJSMarkdown)
  .factory(nestjsMarkedNunjucksTag)
  .factory(nestjsMarkedNunjucksFilter)
  .factory(cleanMarkdownNunjucksFilter)
  .processor(extractContentTitleProcessor)
  .processor(computeOutputPathProcessor)
  .processor(computeWhoUsesProcessor)
  .processor(outputCleanMarkdownProcessor)
  .config((readFilesProcessor: any, contentFileReader: ContentFileReader) => {
    readFilesProcessor.fileReaders.push(contentFileReader);
  })
  .config(
    (
      templateEngine: any,
      nestjsMarkedNunjucksTag: any,
      nestjsMarkedNunjucksFilter: any,
      cleanMarkdownNunjucksFilter: any,
    ) => {
      templateEngine.tags.push(nestjsMarkedNunjucksTag);
      templateEngine.filters.push(nestjsMarkedNunjucksFilter);
      templateEngine.filters.push(cleanMarkdownNunjucksFilter);
    },
  )
  .config((computeIdsProcessor) => {
    computeIdsProcessor.idTemplates.push({
      docTypes: ['content', 'who-uses'],
      getId: (doc: Document) => {
        return (
          doc.fileInfo.relativePath
            // path should be relative to `modules` folder
            .replace(/.*\/?modules\//, '')
            // path should not include `/docs/`
            .replace(/\/docs\//, '/')
            // path should not have a suffix
            .replace(/\.\w*$/, '')
        );
      },
      getAliases: (doc: Document) => [doc.id],
    });
  });

export * from './processors';
export * from './readers';

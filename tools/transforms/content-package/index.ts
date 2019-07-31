import { Package } from 'dgeni';
import { ContentFileReader, contentFileReader } from './readers';
import {
  extractContentTitleProcessor,
  computeOutputPathProcessor,
  computeWhoUsesProcessor
} from './processors';
import { renderNestJSMarkdown } from './services';
import { nestjsMarkedNunjucksTag } from './rendering/tags/nestjsmarked';
import { nestjsMarkedNunjucksFilter } from './rendering/filters/nestjsmarked';
import { Document } from '../shared';

export default new Package('content', [])
  .factory(contentFileReader)
  .factory(renderNestJSMarkdown)
  .factory(nestjsMarkedNunjucksTag)
  .factory(nestjsMarkedNunjucksFilter)

  .processor(extractContentTitleProcessor)
  .processor(computeOutputPathProcessor)
  .processor(computeWhoUsesProcessor)

  .config((readFilesProcessor: any, contentFileReader: ContentFileReader) => {
    readFilesProcessor.fileReaders.push(contentFileReader);
  })

  .config(
    (
      templateEngine: any,
      nestjsMarkedNunjucksTag: any,
      nestjsMarkedNunjucksFilter: any
    ) => {
      templateEngine.tags.push(nestjsMarkedNunjucksTag);
      templateEngine.filters.push(nestjsMarkedNunjucksFilter);
    }
  )

  .config(computeIdsProcessor => {
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
      getAliases: (doc: Document) => [doc.id]
    });
  });

export * from './readers';
export * from './processors';

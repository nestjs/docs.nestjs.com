import { Package } from 'dgeni';

import { CONTENTS_PATH } from '../config';
import nestjsBasePackage, {
  ConvertToJsonProcessor
} from '../nestjs-base-package';
import contentPackage, { contentFileReader } from '../content-package';

export default new Package('nestjs-content', [
  nestjsBasePackage,
  contentPackage
])
  .config((readFilesProcessor: any) => {
    readFilesProcessor.sourceFiles = readFilesProcessor.sourceFiles.concat([
      {
        basePath: CONTENTS_PATH,
        include: CONTENTS_PATH + '/**/*.md',
        fileReader: contentFileReader.name
      },
      {
        basePath: CONTENTS_PATH,
        include: CONTENTS_PATH + '/navigation.json',
        fileReader: 'jsonFileReader'
      },
      {
        basePath: CONTENTS_PATH,
        include: CONTENTS_PATH + '/discover/who-uses.json',
        fileReader: 'jsonFileReader'
      }
    ]);
  })

  .config((computePathsProcessor: any) => {
    // Replace any path templates inherited from other packages
    // (we want full and transparent control)
    computePathsProcessor.pathTemplates = computePathsProcessor.pathTemplates.concat(
      [
        {
          docTypes: ['content', 'who-uses'],
          getPath: doc => `${doc.id.replace(/\/index$/, '')}`,
          outputPathTemplate: '${path}.json'
        },
        {
          docTypes: ['who-uses-json'],
          pathTemplate: '${id}',
          outputPathTemplate: '../${id}.json'
        }
      ]
    );
  })
  // .config((convertToJsonProcessor: ConvertToJsonProcessor) => {
  //   convertToJsonProcessor.docTypes.push('content');
  // });

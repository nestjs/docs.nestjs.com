import { Package } from 'dgeni';
import nestjsContentPackage from '../nestjs-content-package';
import nestjsBasePackage from '../nestjs-base-package';
import { cleanGeneratedFiles } from './processors';

export default new Package('nestjs', [nestjsContentPackage, nestjsBasePackage])
  .processor(cleanGeneratedFiles)

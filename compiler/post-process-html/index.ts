import { Package } from 'dgeni';
import * as base from 'dgeni-packages/base';

// TODO: Remove this package once https://github.com/angular/dgeni-packages/pull/283 is merged
// and consume from dgeni-packages package. Do not forget to remove rehype.

export const postProcessHtmlPackage = new Package('post-process-package', [
  base
]).processor(require('./processors/post-process-html'));

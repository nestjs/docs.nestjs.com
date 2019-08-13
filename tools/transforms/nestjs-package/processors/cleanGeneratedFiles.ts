import * as rimraf from 'rimraf';
import { Processor } from 'dgeni';
import { OUTPUT_PATH } from '../../config';

/**
 * Removes the generated assets
 */
export class CleanGeneratedFiles implements Processor {
  $runAfter = ['writing-files'];
  $runBefore = ['writeFilesProcessor'];
  $process() {
    rimraf.sync(`${OUTPUT_PATH}/{docs,*.json}`);
  }
}

export function cleanGeneratedFiles() {
  return new CleanGeneratedFiles();
}

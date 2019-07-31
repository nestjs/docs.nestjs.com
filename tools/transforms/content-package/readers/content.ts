import { FileReader, FileInfo } from '../../shared';

/**
 * Reads markdown content files
 */
export class ContentFileReader implements FileReader {
  name = 'contentFileReader';
  defaultPattern = /\.md$/;
  getDocs(fileInfo: FileInfo) {
    return [
      {
        docType: fileInfo.baseName === 'who-uses'
          ? 'who-uses'
          : 'content',
        content: fileInfo.content
      }
    ];
  }
}

export function contentFileReader() {
  return new ContentFileReader();
}

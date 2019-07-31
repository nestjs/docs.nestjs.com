import { FileReader, FileInfo } from '../../shared';

export class JsonFileReader implements FileReader {
  name = 'jsonFileReader';
  getDocs(fileInfo: FileInfo) {
    return [
      {
        docType: fileInfo.baseName + '-json',
        data: JSON.parse(fileInfo.content),
        template: 'json-doc.template.json',
        id: fileInfo.baseName,
        aliases: [fileInfo.baseName, fileInfo.relativePath]
      }
    ];
  }
}

export function jsonFileReader() {
  return new JsonFileReader();
}
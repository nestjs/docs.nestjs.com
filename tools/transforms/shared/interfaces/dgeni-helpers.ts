export interface Document {
  docType: string;
  fileInfo?: FileInfo;
  outputPath?: string;
  [any: string]: any;
}

export interface FileInfo {
  basePath: string;
  baseName: string;
  extension: string;
  filePath: string;
  fileReader: string;
  projectRelativePath: string;
  content: string;
  relativePath: string;
}

export interface FileReader {
  name: string;
  defaultPattern?: any;
  getDocs: (fileInfo: FileInfo) => Document[];
}

export type CreateDocMessage = (message: string, document: Document) => string;

export interface DgeniLogger {
  warn(message: string): void;
  log(message: string): void;
  error(message: string): void;
}

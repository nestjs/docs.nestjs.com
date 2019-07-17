export interface Doc {
  id: string;
  docType: string;
  name: string;
  path: string;
  outputPath: string;
  moduleDoc: Doc;
}

export interface ModuleDoc extends Doc {
  docType: 'module';
  exports: Doc[];
}

export interface PackageDoc extends Doc {
  docType: 'package';
}
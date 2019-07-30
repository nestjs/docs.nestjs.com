export interface TagDoc {
  tagName: string;
}

export interface ParameterDoc {
  declaration: string;
}

export interface ConstructorDoc {
  parameterDocs: ParameterDoc[];
}

export interface ContainerDoc {
  constructorDoc: ConstructorDoc;
}

export interface MemberDoc {
  description: string;
  containerDoc: ContainerDoc;
  declaration: string;
  constructorParamDoc?: ParameterDoc;
}

export interface MethodDoc {}

export interface PropertyDoc {}

export interface FileInfoDoc {
  baseName: string;
  filePath: string;
  content: string;
}

export interface Doc {
  id?: string;
  docType?: string;
  name?: string;
  shortDescription?: string;
  description?: string;
  see?: string;
  path?: string;
  outputPath?: string;
  moduleDoc?: Doc;
  breadCrumbs?: BreadCrumb[];
  decorators?: any[];
  template?: string;
  privateExport?: boolean;
  members?: MemberDoc[];
  methods?: MethodDoc[];
  properties?: PropertyDoc[];
  tags?: { tags: TagDoc[] };
  staticMethods?: MethodDoc[];
  staticProperties?: PropertyDoc[];
  statics?: MemberDoc[];
  fileInfo?: FileInfoDoc;
  publicApi?: string;
  constructorDoc?: any;
}

export interface BreadCrumb {
  text: string;
  path: string;
}

export interface ModuleDoc extends Doc {
  docType: 'module' | 'package' | 'subpackage' | 'nestmodule';
  exports: Doc[];
  modules?: NestModuleDoc[];
  classes: Doc[];
  injectables: InjectableDoc[];
  decorators: DecoratorDoc[];
  functions: FunctionDoc[];
  structures: StructureDoc[];
  pipes: PipeDoc[];
  types: TypeDoc[];
}

export interface PackageDoc extends ModuleDoc {
  docType: 'package' | 'nestmodule';
}

export interface PackageContentDoc extends Doc {
  docType: 'package-content';
}

export interface RenderedDoc extends Doc {
  renderedContent?: string;
}

export interface NestModuleDoc extends Doc {
  docType: 'nestmodule';
  nestmoduleoptions: any;
}

export interface InjectableDoc extends Doc {
  modules: any[];
}

export interface DecoratorDoc extends Doc {
  docType: 'decorator';
}
export interface FunctionDoc extends Doc {
  docType: 'function';
}
export interface StructureDoc extends Doc {
  docType: 'enum' | 'interface';
}
export interface PipeDoc extends Doc {
  docType: 'pipe';
}
export interface TypeDoc extends Doc {
  docType: 'type-alias' | 'const';
}

export interface ApiExportItem {
  name: string;
  title: string;
  path: string;
  docType: string;
}

export interface ApiPackageItem {
  name: string;
  title: string;
  path: string;
  items: ApiExportItem[];
}

export interface ApiListDoc {
  docType: string;
  template: string;
  path: string;
  outputPath: string;
  data: ApiPackageItem[];
}

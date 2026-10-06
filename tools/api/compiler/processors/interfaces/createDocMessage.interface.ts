import { Doc } from './doc.interface';

export type CreateDocMessage = (message: string, doc: Doc) => string;

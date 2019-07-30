import { Doc } from './doc.interface.ts';

export type CreateDocMessage = (message: string, doc: Doc) => string;

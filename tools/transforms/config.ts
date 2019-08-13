import { resolve } from 'path';

export const PROJECT_ROOT = resolve(__dirname, '../../');
export const CONTENTS_PATH = resolve(PROJECT_ROOT, 'content');

export const SRC_PATH = resolve(PROJECT_ROOT, 'src');
export const OUTPUT_PATH = resolve(SRC_PATH, 'app/homepage/pages');
export const DOCS_OUTPUT_PATH = resolve(OUTPUT_PATH, 'docs');
export const TEMPLATES_PATH = resolve(__dirname, './templates');

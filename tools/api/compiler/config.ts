import { resolve } from 'path';
import { PACKAGES } from '../packages';

export { PACKAGES, PACKAGE_GROUPS } from '../packages';

export const DOC_PATH_PREFIX = '/api';
export const PROJECT_ROOT = resolve(__dirname, '../../../sources');
export const OUTPUT_PATH = resolve(__dirname, '../../../src/generated/api');

export const PACKAGES_PATH = PACKAGES.map((p) => `./${p.path}`);

/** Entry-point directories (e.g. `authentication/lib`) that are public by default. */
export const PUBLIC_BY_DEFAULT_DIRS = PACKAGES.filter(
  (p) => p.publicByDefault,
).map((p) => p.path.replace(/\/index\.ts$/, ''));

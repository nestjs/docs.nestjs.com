/* eslint-disable @typescript-eslint/no-require-imports -- dgeni and the rehype plugins it runs are CommonJS */
const { resolve } = require('path');
const { readdirSync } = require('fs');

export function requireFolder(dirname, folderPath) {
  const absolutePath = resolve(dirname, folderPath);
  return readdirSync(absolutePath)
    .filter(p => !/[._]spec\.js$/.test(p))  // ignore spec files
    .map(p => require(resolve(absolutePath, p)));
}

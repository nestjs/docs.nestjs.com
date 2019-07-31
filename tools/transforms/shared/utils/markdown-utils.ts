import * as crypto from 'crypto';

export function escapeBrackets(text: string): string {
  text = text.replace(new RegExp('{', 'g'), '&#123;');
  text = text.replace(new RegExp('}', 'g'), '&#125;');
  return text;
}

export function appendEmptyLine(text: string) {
  const codeEscape = '">';
  const codeEscId = text.indexOf(codeEscape);
  return (
    text.slice(0, codeEscId + codeEscape.length) +
    '\n' +
    text.slice(codeEscId + codeEscape.length, text.length)
  );
}

export function replaceFilename(
  renderer: (code: string, directiveRef: string) => string,
  text: string,
  filenameKey: string,
  filenameIndex: number,
) {
  const startIndex = filenameIndex + filenameKey.length;
  const endIndex = text.indexOf(')');
  const directiveRef = `app` + crypto.randomBytes(20).toString('hex');
  const filename = text.slice(startIndex + 1, endIndex);
  return (
    `
<span class="filename">` +
    (filename.length > 0
      ? `
  {{ '${filename}' | extension: ${directiveRef}.isJsActive }}`
      : '') +
    `
<app-tabs #${directiveRef}></app-tabs>
</span>` +
    renderer(text.slice(endIndex + 1), directiveRef).trim()
  );
}

export function parseSwitcher(
  renderer: (code: string, language: 'typescript' | 'javascript') => string,
  text: string,
  switchKey: string,
  switchIndex: number,
  elementKey?: string,
) {
  const tsCode = text.slice(0, switchIndex).trim();
  const jsCode = text.slice(switchIndex + switchKey.length, text.length).trim();
  const wrapCondition = (snippet: string, lang: 'ts' | 'js') =>
    elementKey
      ? snippet.slice(0, 4) +
        ` [class.hide]="${lang === 'js' ? '!' : ''}${elementKey}.isJsActive"` +
        snippet.slice(4, snippet.length)
      : snippet;
  return (
    wrapCondition(renderer(tsCode, 'typescript'), 'ts') +
    wrapCondition(renderer(jsCode, 'typescript'), 'js')
  );
}

export function insertText(text: string, index: number, textToAdd: string) {
  return text.slice(0, index) + textToAdd + text.slice(index);
}

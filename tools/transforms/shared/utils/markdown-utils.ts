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
  renderer: (code: string) => string,
  text: string,
  filenameKey: string,
  filenameIndex: number,
) {
  const startIndex = filenameIndex + filenameKey.length;
  const endIndex = text.indexOf(')');
  const filename = text.slice(startIndex + 1, endIndex);
  return `
<code-element ${filename.length ? `filename="${filename}"` : ''}>${renderer(
    text.slice(endIndex + 1).trim(),
  )}</code-element>`;
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

  const wrapCondition = (htmlSnippet: string, lang: 'ts' | 'js'): string => {
    // The beginning of the pre-Tag (<pre)
    const beginPreTag = htmlSnippet.slice(0, 4);
    const endPreTag = htmlSnippet.slice(4, htmlSnippet.length);
    return `${beginPreTag} slot=${lang}${endPreTag}`;
  };

  return (
    wrapCondition(renderer(tsCode, 'typescript'), 'ts') +
    wrapCondition(renderer(jsCode, 'typescript'), 'js')
  );
}

export function insertText(text: string, index: number, textToAdd: string) {
  return text.slice(0, index) + textToAdd + text.slice(index);
}

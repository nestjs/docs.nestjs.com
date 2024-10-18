import { Renderer } from 'marked';
import {
  replaceFilename,
  parseSwitcher,
  escapeBrackets,
  appendEmptyLine,
  escapeAts,
} from '../../../shared';

const encodedSpecialChar = '&amp;#125';

export function applyCodeRenderer(renderer: Renderer) {
  const originalCodeRenderer = renderer.code;
  const originalCodeSpanRenderer = renderer.codespan;

  renderer.codespan = function (code: string) {
    const escaped = escapeAts(originalCodeSpanRenderer.call(renderer, code));
    if (escaped.indexOf(encodedSpecialChar) >= 0) {
      return escaped.replace(new RegExp(encodedSpecialChar, 'g'), '&#125');
    }
    return escaped;
  };

  renderer.code = function (
    code: string,
    language: string,
    isEscaped: boolean,
    switcherKey?: string,
    skipCopyButton?: boolean,
  ) {
    const filenameKey = '@@filename';
    const filenameIndex = code.indexOf(filenameKey);
    if (filenameIndex >= 0) {
      const output = replaceFilename(
        (text, directiveRef) =>
          renderer.code(text, language, isEscaped, directiveRef, true),
        code,
        filenameKey,
        filenameIndex,
      );

      return `<app-copy-button class="with-heading">${output}</app-copy-button>`;
    }

    const switchKey = '@@switch';
    const switchIndex = code.indexOf(switchKey);
    if (switchIndex >= 0) {
      const result = parseSwitcher(
        (text, lang) => renderer.code(text, lang, isEscaped, undefined, true),
        code,
        switchKey,
        switchIndex,
        switcherKey,
      );
      return escapeAts(escapeBrackets(result));
    }
    let output: string = originalCodeRenderer.call(
      renderer,
      code,
      language,
      isEscaped,
    );
    output = switcherKey ? output : appendEmptyLine(output);

    const escaped = escapeAts(escapeBrackets(output));
    if (language === 'typescript' || language === 'ts') {
      if (!skipCopyButton) {
        return `<app-copy-button>${escaped}</app-copy-button>`;
      }
      return escaped;
    }
    return escaped;
  };
}

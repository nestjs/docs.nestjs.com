import { Renderer, Tokens } from 'marked';
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

  renderer.codespan = function (token: Tokens.Codespan) {
    const escaped = escapeAts(originalCodeSpanRenderer.call(renderer, token));
    if (escaped.indexOf(encodedSpecialChar) >= 0) {
      return escaped.replace(new RegExp(encodedSpecialChar, 'g'), '&#125');
    }
    return escaped;
  };

  renderer.code = function (
    token: Tokens.Code,
    switcherKey?: string,
    skipCopyButton?: boolean,
  ) {
    const code = token.text;
    const language = token.lang;
    const renderCode = (
      text: string,
      lang: string | undefined,
      directiveRef?: string,
      skip?: boolean,
    ) =>
      (renderer.code as any)(
        { type: 'code', raw: text, text, lang, escaped: token.escaped },
        directiveRef,
        skip,
      ) as string;

    const filenameKey = '@@filename';
    const filenameIndex = code.indexOf(filenameKey);
    if (filenameIndex >= 0) {
      const output = replaceFilename(
        (text, directiveRef) => renderCode(text, language, directiveRef, true),
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
        (text, lang) => renderCode(text, lang, undefined, true),
        code,
        switchKey,
        switchIndex,
        switcherKey,
      );
      return escapeAts(escapeBrackets(result));
    }
    let output: string = originalCodeRenderer.call(renderer, token);
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

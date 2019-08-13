import { Renderer } from 'marked';
import {
  replaceFilename,
  parseSwitcher,
  escapeBrackets,
  appendEmptyLine
} from '../../../shared';

export function applyCodeRenderer(renderer: Renderer) {
  const originalCodeRenderer = renderer.code;
  renderer.code = function(
    code: string,
    language: string,
    isEscaped: boolean,
    switcherKey?: string
  ) {
    const filenameKey = '@@filename';
    const filenameIndex = code.indexOf(filenameKey);
    if (filenameIndex >= 0) {
      return replaceFilename(
        (text, directiveRef) =>
          // @ts-ignore
          renderer.code(text, language, isEscaped, directiveRef),
        code,
        filenameKey,
        filenameIndex
      );
    }

    const switchKey = '@@switch';
    const switchIndex = code.indexOf(switchKey);
    if (switchIndex >= 0) {
      const result = parseSwitcher(
        (text, lang) => renderer.code(text, lang, isEscaped),
        code,
        switchKey,
        switchIndex,
        switcherKey
      );
      return escapeBrackets(result);
    }
    let output: string = originalCodeRenderer.call(
      renderer,
      code,
      language,
      isEscaped
    );
    output = switcherKey ? output : appendEmptyLine(output);
    return escapeBrackets(output);
  };
}

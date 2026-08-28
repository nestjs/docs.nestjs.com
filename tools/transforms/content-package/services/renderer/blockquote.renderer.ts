import { Renderer, Tokens } from 'marked';
import { insertText } from '../../../shared';

export function applyBlockQuoteRenderer(renderer: Renderer) {
  const originalBlockquoteRenderer = renderer.blockquote.bind(renderer);

  const blockquote = (token: Tokens.Blockquote) => {
    let text: string = originalBlockquoteRenderer(token);
    text = text.replace('<p>', '');
    text = text.replace('</p>', '');

    const blockquoteTag = '<blockquote>';
    text = text.replace('<blockquote>', '<blockquote');
    text = insertText(text, blockquoteTag.length - 1, ` class="`);
    text = insertText(text, text.indexOf('<strong>'), '">');
    return text;
  };

  renderer.blockquote = blockquote;
}

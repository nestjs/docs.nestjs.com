import { Renderer } from 'marked';
import { insertText } from '../../../shared';

export function applyBlockQuoteRenderer(renderer: Renderer) {
  const originalBlockquoteRenderer = renderer.blockquote.bind(renderer);

  const blockquote = (quote: string) => {
    let text: string = originalBlockquoteRenderer(quote);
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

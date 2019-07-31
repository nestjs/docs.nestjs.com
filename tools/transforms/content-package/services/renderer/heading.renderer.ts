import { Renderer } from 'marked';
import { insertText } from '../../../shared';

export function applyHeadingRenderer(renderer: Renderer) {
  const originalHeadingRenderer = renderer.heading.bind(renderer);

  const heading = (...args: any[]) => {
    let text = originalHeadingRenderer(...args);
    if (!text.includes('h4')) {
      return text;
    }
    const startIndex = text.indexOf('<h') + 3;
    text = insertText(text, startIndex, ` appAnchor`);
    text = insertText(text, text.indexOf('">') + 2, '<span>');
    return insertText(text, text.length - 6, '</span>');
  };

  renderer.heading = heading;
}

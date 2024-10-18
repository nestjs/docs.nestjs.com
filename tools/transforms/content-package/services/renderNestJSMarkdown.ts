import * as marked from 'marked';
import {
  applyTableRenderer,
  applyCodeRenderer,
  applyBlockQuoteRenderer,
  applyHeadingRenderer,
  applyLinkRenderer,
} from './renderer';
import { wrapRendererWithEscapeAts } from './renderer/wrap-renderer-with-escape-ats';

export type RenderNestJSMarkdown = (content: string) => string;

export function renderNestJSMarkdown() {
  const renderer = new marked.Renderer();

  wrapRendererWithEscapeAts(renderer, 'paragraph');
  wrapRendererWithEscapeAts(renderer, 'strong');
  wrapRendererWithEscapeAts(renderer, 'em');
  wrapRendererWithEscapeAts(renderer, 'html');
  wrapRendererWithEscapeAts(renderer, 'link');

  applyTableRenderer(renderer);
  applyCodeRenderer(renderer);
  applyLinkRenderer(renderer);
  applyHeadingRenderer(renderer);
  applyBlockQuoteRenderer(renderer);

  return (content: string) => marked(content, { renderer });
}

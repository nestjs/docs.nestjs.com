import { Marked, Renderer } from 'marked';
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
  const markedInstance = new Marked();
  const renderer = new Renderer();

  wrapRendererWithEscapeAts(renderer, 'paragraph');
  wrapRendererWithEscapeAts(renderer, 'strong');
  wrapRendererWithEscapeAts(renderer, 'em');
  wrapRendererWithEscapeAts(renderer, 'html');
  wrapRendererWithEscapeAts(renderer, 'link');

  applyTableRenderer(renderer);
  applyCodeRenderer(renderer);
  applyLinkRenderer(renderer);
  const resetHeadingSlugger = applyHeadingRenderer(renderer);
  applyBlockQuoteRenderer(renderer);

  return (content: string) => {
    resetHeadingSlugger();
    return preserveSpacesBetweenInlineElements(
      markedInstance.parse(content, { renderer }) as string,
    );
  };
}

const INLINE_GAP =
  /(<\/(?:a|b|code|em|i|strong)>)[ \t\n]+(?=<(?:a|b|code|em|i|strong)[\s>])/g;

/**
 * The pages compile as Angular templates, and Angular drops whitespace-only
 * text between two elements, so `**Note** [link]` would render as
 * "Notelink". `&ngsp;` is the space Angular keeps. Code blocks are left as
 * they are.
 */
export function preserveSpacesBetweenInlineElements(html: string): string {
  return html
    .split(/(<pre[\s\S]*?<\/pre>)/)
    .map((part) => (part.startsWith('<pre') ? part : part.replace(INLINE_GAP, '$1&ngsp;')))
    .join('');
}

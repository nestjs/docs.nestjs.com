import { Renderer } from 'marked';
import { escapeAts } from '../../../shared';

export function wrapRendererWithEscapeAts(renderer: Renderer, method: string) {
  const originalRenderer = renderer[method];

  const wrapped = (...args: any[]) => {
    return escapeAts(originalRenderer.call(renderer, ...args));
  };

  renderer[method] = wrapped;
}

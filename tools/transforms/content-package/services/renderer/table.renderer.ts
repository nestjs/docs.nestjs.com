import { Renderer } from 'marked';

export function applyTableRenderer(renderer: Renderer) {
  const originalTableRenderer = renderer.table;

  const table = (header: string, body: string) =>
    header.includes('<th></th>')
      ? originalTableRenderer.call(renderer, '', body)
      : originalTableRenderer.call(renderer, header, body);

  renderer.table = table;
}

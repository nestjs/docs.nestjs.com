import { Renderer, Tokens } from 'marked';

export function applyTableRenderer(renderer: Renderer) {
  const originalTableRenderer = renderer.table;

  const table = (token: Tokens.Table) => {
    const output = originalTableRenderer.call(renderer, token) as string;
    // marked v2 behavior: a header row containing an empty cell was dropped
    // entirely (rendered as an empty <thead>).
    if (output.includes('<th></th>')) {
      return output.replace(/<thead>[\s\S]*?<\/thead>/, '<thead>\n</thead>');
    }
    return output;
  };

  renderer.table = table;
}

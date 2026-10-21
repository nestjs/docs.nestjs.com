import { describe, expect, it } from 'vitest';
import { renderNestJSMarkdown } from '../renderNestJSMarkdown';

const fence = (lang: string, code: string) =>
  '```' + lang + '\n' + code + '\n```\n';

describe('applyCodeRenderer', () => {
  it('renders an install command with a package manager switch', () => {
    const render = renderNestJSMarkdown();
    expect(render(fence('bash', '$ npm i --save @nestjs/config'))).toBe(
      '<div class="pm-switch"><div class="filename">' +
        '<button type="button" aria-label="Package manager: npm, switch to yarn">npm</button>' +
        '</div><pre><code class="language-bash">\n$ npm i --save &#64;nestjs/config\n</code></pre>\n' +
        '</div>\n',
    );
    expect(render(fence('shell', '$ npm i -D vitest'))).toContain(
      '<div class="pm-switch">',
    );
  });

  it('renders other code blocks as before', () => {
    const render = renderNestJSMarkdown();
    expect(render(fence('bash', '$ npm run start'))).toBe(
      '<pre><code class="language-bash">\n$ npm run start\n</code></pre>\n',
    );
    expect(render(fence('typescript', '// $ npm i zod'))).toBe(
      '<app-copy-button><pre><code class="language-typescript">\n// $ npm i zod\n</code></pre>\n</app-copy-button>',
    );
    const switcher = render(
      fence('bash', '@@filename()\n$ npm i zod\n@@switch\n$ npm i zod'),
    );
    expect(switcher).toContain('<app-tabs');
    expect(switcher).not.toContain('pm-switch');
  });
});

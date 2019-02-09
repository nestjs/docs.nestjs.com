import * as chokidar from 'chokidar';
import * as fs from 'fs';
import * as marked from 'marked';
import { join } from 'path';
import {
  appendEmptyLine,
  escapeBrackets,
  parseSwitcher,
  replaceFilename,
} from './markdown-utils';

const renderer: any = new marked.Renderer();

const originalTableRenderer = renderer.table;
renderer.table = (header: string, body: string) =>
  header.includes('<th></th>')
    ? originalTableRenderer.call(renderer, '', body)
    : originalTableRenderer.call(renderer, header, body);

const originalCodeRenderer = renderer.code;
renderer.code = function(
  code: string,
  language: string,
  isEscaped: boolean,
  switcherKey?: string,
) {
  const filenameKey = '@@filename';
  const filenameIndex = code.indexOf(filenameKey);
  if (filenameIndex >= 0) {
    return replaceFilename(
      (text, directiveRef) =>
        renderer.code(text, language, isEscaped, directiveRef),
      code,
      filenameKey,
      filenameIndex,
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
      switcherKey,
    );
    return escapeBrackets(result);
  }
  let output: string = originalCodeRenderer.call(
    renderer,
    code,
    language,
    isEscaped,
  );
  output = appendEmptyLine(output);
  return escapeBrackets(output);
};

const originalLinkRenderer = renderer.link;
renderer.link = (href: string, title: string, text: string) => {
  if (!href.includes('http')) {
    return (originalLinkRenderer.call(
      renderer,
      href,
      title,
      text,
    ) as string).replace('href', 'routerLink');
  }
  return originalLinkRenderer.call(renderer, href, title, text);
};

const originalHeadingRenderer = renderer.heading.bind(renderer);
renderer.heading = (...args: string[]) => {
  const text = originalHeadingRenderer(...args);
  const startIndex = text.indexOf('<h') + 3;
  return text.slice(0, startIndex) + ` appAnchor` + text.slice(startIndex);
};

const rootDir = 'content';
const watcher = chokidar.watch(join(process.cwd(), rootDir), {
  ignored: /(^|[\/\\])\../,
  persistent: true,
});

console.log('# Markdown compiler is watching files.. (content dir)');
watcher.on('change', path => {
  fs.readFile(path, 'utf-8', (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    const html = `<div class="content" #contentReference>
      ${marked(data.toString(), { renderer })}
    </div>`;

    const distPath = path.slice(
      path.indexOf(rootDir) + rootDir.length,
      path.length - 3, // strip extension
    );
    const pathSegments = distPath.split('/');
    const distFilename =
      pathSegments[pathSegments.length - 1] + '.component.html';

    fs.writeFileSync(
      join(process.cwd(), `src/app/homepage/pages${distPath}/${distFilename}`),
      html + '\n',
    );
    console.log(`${distFilename} has been saved.`);
  });
});

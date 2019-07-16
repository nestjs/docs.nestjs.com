import * as chokidar from 'chokidar';
import * as fg from 'fast-glob';
import * as fs from 'fs';
import * as marked from 'marked';
import { join } from 'path';
import {
  appendEmptyLine,
  escapeBrackets,
  insertText,
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
  output = switcherKey ? output : appendEmptyLine(output);
  return escapeBrackets(output);
};

const originalLinkRenderer = renderer.link;
renderer.link = (href: string, title: string, text: string) => {
  if (!href.includes('http') && !href.includes('mailto')) {
    return (originalLinkRenderer.call(
      renderer,
      href,
      title,
      text,
    ) as string).replace('href', 'routerLink');
  }

  if (href.includes('http') && !href.includes('mailto')) {
    let baseLink = (originalLinkRenderer.call(
      renderer,
      href,
      title,
      text
    ) as string);

    baseLink = `${baseLink.substr(0, 2)} target="_blank"${baseLink.substr(2)}`;
    return baseLink;
  }
  return originalLinkRenderer.call(renderer, href, title, text);
};

const originalHeadingRenderer = renderer.heading.bind(renderer);
renderer.heading = (...args: string[]) => {
  let text = originalHeadingRenderer(...args);
  if (!text.includes('h4')) {
    return text;
  }
  const startIndex = text.indexOf('<h') + 3;
  text = insertText(text, startIndex, ` appAnchor`);
  text = insertText(text, text.indexOf('">') + 2, '<span>');
  return insertText(text, text.length - 6, '</span>');
};

const originalBlockquoteRenderer = renderer.blockquote.bind(renderer);
renderer.blockquote = (quote: string) => {
  let text: string = originalBlockquoteRenderer(quote);
  text = text.replace('<p>', '');
  text = text.replace('</p>', '');

  const blockquoteTag = '<blockquote>';
  text = text.replace('<blockquote>', '<blockquote');
  text = insertText(text, blockquoteTag.length - 1, ` class="`);
  text = insertText(text, text.indexOf('<strong>'), '">');
  return text;
};

const rootDir = 'content';
function readAndCompile(path: string, done: (filename?: string) => void) {
  fs.readFile(path, 'utf-8', (err, data) => {
    if (err) {
      console.error(err);
      return done();
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
    return done(distFilename);
  });
}

const argv = require('yargs').argv;
if (argv.watch) {
  const watcher = chokidar.watch(join(process.cwd(), rootDir), {
    ignored: /(^|[\/\\])\../,
    persistent: true,
  });

  console.log('# Markdown compiler is watching files.. (content dir)');
  watcher.on('change', path => {
    readAndCompile(path, (filename?: string) => {
      filename &&
        console.log(
          `[${filename}] has been saved. (${new Date().toLocaleTimeString()})`,
        );
    });
  });
} else {
  fg(['content/**/*.md']).then(entries => {
    entries.forEach(path =>
      readAndCompile(path as string, (filename?: string) => {
        filename &&
          console.log(
            `[${filename}] has been saved. (${new Date().toLocaleTimeString()})`,
          );
      }),
    );
  });
}

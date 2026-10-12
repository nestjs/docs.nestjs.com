/* eslint-disable @typescript-eslint/no-require-imports -- dgeni and the rehype plugins it runs are CommonJS */
const is = require('hast-util-is-element');
const slug = require('rehype-slug');
const visit = require('unist-util-visit');

const hasClass = (node, cls) => {
  const className = node.properties.className;
  return className && className.includes(cls);
};

const addClass = (node, cls) => {
  if (!node.properties.className) {
    node.properties.className = '';
  }
  node.properties.className += ' ' + cls;
};

const link = () => (tree) =>
  visit(tree, (node) => {
    if (
      is(node, 'pre') &&
      !hasClass(node, 'language-typescript') &&
      node.children.find((child) => child.tagName === 'code')
    ) {
      addClass(node, 'language-typescript');
      const $code = node.children.find((child) => child.tagName === 'code');
      addClass($code, 'language-typescript');
      if (!$code.children[0]?.value?.startsWith('\n')) {
        $code.children.unshift({ type: 'text', value: '\n' });
      }
    }
  });

module.exports = [slug, [link]];

export {};

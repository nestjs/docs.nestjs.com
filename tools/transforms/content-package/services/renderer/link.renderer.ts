import { Renderer, Tokens } from 'marked';

export function applyLinkRenderer(renderer: Renderer) {
  const originalLinkRenderer = renderer.link;

  const link = (rawToken: Tokens.Link) => {
    // marked v2 HTML-escaped hrefs; the generated files are compiled as
    // Angular templates, where a raw "&" is parsed as an (unknown) entity.
    const token: Tokens.Link = {
      ...rawToken,
      href: rawToken.href.replace(/&(?!(?:[a-zA-Z]+|#\d+|#x[\da-fA-F]+);)/g, '&amp;'),
    };
    const { href } = token;
    // Match the scheme, not a substring: internal paths such as `/http/cookies`
    // or `/application/http-module` contain "http" too.
    const isExternal = /^(https?:)?\/\//i.test(href);
    const isMailto = href.startsWith('mailto:');
    if (!isExternal && !isMailto) {
      const link = originalLinkRenderer.call(renderer, token) as string;

      if (link.includes('#')) {
        return link;
      }
      return link.replace('href', 'routerLink');
    }

    if (isExternal) {
      let baseLink = originalLinkRenderer.call(renderer, token) as string;

      baseLink = `${baseLink.substr(0, 2)} rel='nofollow' target='_blank'${baseLink.substr(
        2,
      )}`;
      return baseLink;
    }
    return originalLinkRenderer.call(renderer, token);
  };

  renderer.link = link;
}

import { Renderer } from 'marked';

export function applyLinkRenderer(renderer: Renderer) {
  const originalLinkRenderer = renderer.link;

  const link = (href: string, title: string, text: string) => {
    if (!href.includes('http') && !href.includes('mailto')) {
      const link = (originalLinkRenderer.call(
        renderer,
        href,
        title,
        text
      ) as string);

      if (link.includes('#')) {
        return link;
      }
      return link.replace('href', 'routerLink');
    }

    if (href.includes('http') && !href.includes('mailto')) {
      let baseLink = originalLinkRenderer.call(
        renderer,
        href,
        title,
        text
      ) as string;

      baseLink = `${baseLink.substr(0, 2)} rel='nofollow' target='_blank'${baseLink.substr(
        2
      )}`;
      return baseLink;
    }
    return originalLinkRenderer.call(renderer, href, title, text);
  };

  renderer.link = link;
}

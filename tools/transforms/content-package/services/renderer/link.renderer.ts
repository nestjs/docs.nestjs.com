import { Renderer } from 'marked';

export function applyLinkRenderer(renderer: Renderer) {
  const originalLinkRenderer = renderer.link;

  const link = (href: string, title: string, text: string) => {
    if (!href.includes('http') && !href.includes('mailto')) {
      return (originalLinkRenderer.call(
        renderer,
        href,
        title,
        text
      ) as string).replace('href', 'routerLink');
    }

    if (href.includes('http') && !href.includes('mailto')) {
      let baseLink = originalLinkRenderer.call(
        renderer,
        href,
        title,
        text
      ) as string;

      baseLink = `${baseLink.substr(0, 2)} target='_blank'${baseLink.substr(
        2
      )}`;
      return baseLink;
    }
    return originalLinkRenderer.call(renderer, href, title, text);
  };

  renderer.link = link;
}

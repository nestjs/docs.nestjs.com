import { Renderer, Tokens } from 'marked';

// Replicates the heading-id slugger that marked v2 shipped built-in (including
// its duplicate-slug "-1"/"-2" suffixing); modern marked no longer generates
// heading ids, but the docs' anchor links and the appAnchor directive rely on
// them.
class Slugger {
  private seen: Record<string, number> = Object.create(null);

  slug(value: string): string {
    const originalSlug = value
      .toLowerCase()
      .trim()
      .replace(/<[!/a-z].*?>/gi, '')
      .replace(
        /[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~]/g,
        '',
      )
      .replace(/\s/g, '-');

    let slug = originalSlug;
    let occurenceAccumulator = 0;
    if (slug in this.seen) {
      occurenceAccumulator = this.seen[originalSlug];
      do {
        occurenceAccumulator++;
        slug = originalSlug + '-' + occurenceAccumulator;
      } while (slug in this.seen);
    }
    this.seen[originalSlug] = occurenceAccumulator;
    this.seen[slug] = 0;
    return slug;
  }
}

export function applyHeadingRenderer(renderer: Renderer): () => void {
  let slugger = new Slugger();

  renderer.heading = function (token: Tokens.Heading) {
    const text = this.parser.parseInline(token.tokens);
    const id = slugger.slug(token.text);
    if (token.depth !== 4) {
      return `<h${token.depth} id="${id}">${text}</h${token.depth}>\n`;
    }
    return `<h4 appAnchor id="${id}"><span>${text}</span></h4>\n`;
  };

  // marked v2 created a fresh Slugger for every marked() call; the caller must
  // invoke this before each document so ids restart per page.
  return () => {
    slugger = new Slugger();
  };
}

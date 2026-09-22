import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DocsViewportScroller } from './docs-viewport-scroller';

/**
 * jsdom has no layout, so the page is simulated: `scrollY` is a number the
 * mocked `scrollTo` moves (clamped to `maxScroll`), each heading has a document
 * offset the test can shift, and animation frames run only when `frame()` is
 * called.
 */
describe('DocsViewportScroller', () => {
  const HEADING_MARGIN = 100;
  let scroller: DocsViewportScroller;
  let scrollY: number;
  let maxScroll: number;
  let now: number;
  let frames: FrameRequestCallback[];
  let offsets: Map<Element, number>;
  let scrollTo: ReturnType<typeof vi.fn>;

  const setPath = (pathname: string) =>
    window.history.replaceState(null, '', pathname);

  const addHeading = (id: string, documentTop: number) => {
    const heading = document.createElement('h4');
    heading.id = id;
    document.body.appendChild(heading);
    offsets.set(heading, documentTop);
    return heading;
  };

  /** Advances the clock and runs the pending animation frame. */
  const frame = (elapsed = 16) => {
    now += elapsed;
    const pending = frames;
    frames = [];
    pending.forEach((callback) => callback(now));
  };

  beforeEach(() => {
    scrollY = 0;
    maxScroll = 100_000;
    now = 0;
    frames = [];
    offsets = new Map();
    document.body.innerHTML = '';
    setPath('/application/validation');

    Object.defineProperty(window, 'scrollY', { configurable: true, get: () => scrollY });
    scrollTo = vi.fn((options: ScrollToOptions) => {
      scrollY = Math.max(0, Math.min(maxScroll, options.top ?? scrollY));
    });
    vi.spyOn(window, 'scrollTo').mockImplementation(scrollTo as never);
    vi.spyOn(window.performance, 'now').mockImplementation(() => now);
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {
      frames = [];
    });
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: Element,
    ) {
      const top = (offsets.get(this) ?? 0) - scrollY;
      return { top, bottom: top, left: 0, right: 0, height: 0, width: 0, x: 0, y: top } as DOMRect;
    });
    vi.spyOn(window, 'getComputedStyle').mockImplementation(
      () => ({ scrollMarginTop: `${HEADING_MARGIN}px` }) as CSSStyleDeclaration,
    );

    TestBed.configureTestingModule({ providers: [DocsViewportScroller] });
    scroller = TestBed.inject(DocsViewportScroller);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('jumps instantly to an anchor on a newly rendered page, below the header', () => {
    addHeading('stripping-properties', 5000);

    scroller.scrollToAnchor('stripping-properties');

    expect(scrollTo).toHaveBeenLastCalledWith({ behavior: 'instant', top: 5000 - HEADING_MARGIN });
  });

  it('keeps the anchor pinned while the layout above it shifts', () => {
    addHeading('stripping-properties', 5000);
    scroller.scrollToAnchor('stripping-properties');

    // Code highlighting above the heading pushes it down by 240px.
    offsets.set(document.getElementById('stripping-properties')!, 5240);
    frame();

    expect(scrollY).toBe(5240 - HEADING_MARGIN);
  });

  it('waits for an anchor that renders after the scroll request', () => {
    scroller.scrollToAnchor('late');
    expect(scrollTo).not.toHaveBeenCalled();

    addHeading('late', 3000);
    frame();

    expect(scrollY).toBe(3000 - HEADING_MARGIN);
  });

  it('lets go once the layout has been stable for a second', () => {
    addHeading('stripping-properties', 5000);
    scroller.scrollToAnchor('stripping-properties');

    frame(1000);
    expect(frames).toHaveLength(0);

    offsets.set(document.getElementById('stripping-properties')!, 6000);
    frame();
    expect(scrollY).toBe(5000 - HEADING_MARGIN);
  });

  it('stops pinning as soon as the reader scrolls', () => {
    addHeading('stripping-properties', 5000);
    scroller.scrollToAnchor('stripping-properties');

    window.dispatchEvent(new Event('wheel'));
    offsets.set(document.getElementById('stripping-properties')!, 5240);
    frame();

    expect(scrollY).toBe(5000 - HEADING_MARGIN);
    expect(frames).toHaveLength(0);
  });

  it('treats a scroll clamped at the end of the page as settled', () => {
    maxScroll = 4500;
    addHeading('learn-more', 5000);
    scroller.scrollToAnchor('learn-more');
    expect(scrollY).toBe(4500);

    frame(1000);

    expect(frames).toHaveLength(0);
  });

  it('scrolls smoothly, without pinning, to an anchor on the page being read', () => {
    addHeading('stripping-properties', 5000);
    scroller.scrollToPosition([0, 0]);
    scrollTo.mockClear();

    scroller.scrollToAnchor('stripping-properties', { behavior: 'smooth' });

    expect(scrollTo).toHaveBeenCalledOnce();
    expect(scrollTo).toHaveBeenCalledWith({ behavior: 'smooth', top: 5000 - HEADING_MARGIN });
    expect(frames).toHaveLength(0);
  });

  it('pins again when the anchor is on another page', () => {
    addHeading('schema-based-validation', 7000);
    scroller.scrollToPosition([0, 0]);

    setPath('/pipes');
    scroller.scrollToAnchor('schema-based-validation');

    expect(scrollTo).toHaveBeenLastCalledWith({ behavior: 'instant', top: 7000 - HEADING_MARGIN });
    expect(frames).toHaveLength(1);
  });

  it('cancels pinning when the router restores a scroll position', () => {
    addHeading('stripping-properties', 5000);
    scroller.scrollToAnchor('stripping-properties');

    scroller.scrollToPosition([0, 1200]);
    offsets.set(document.getElementById('stripping-properties')!, 5240);
    frame();

    expect(scrollY).toBe(1200);
  });
});

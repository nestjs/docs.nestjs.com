import { DOCUMENT, ViewportScroller } from '@angular/common';
import { inject, Injectable } from '@angular/core';

/** How long the target must stay put before the scroller lets go of it. */
const SETTLE_TIME_MS = 1000;
/** Upper bound for pages that never stop moving (e.g. a slow image). */
const MAX_PIN_TIME_MS = 10_000;
/** Any of these means the reader has taken over, so pinning stops at once. */
const USER_INPUT_EVENTS = ['wheel', 'touchstart', 'keydown', 'mousedown'];

/**
 * Replaces Angular's `BrowserViewportScroller` so fragment links land on their
 * heading. The router still decides *when* to scroll; this class decides *how*.
 *
 * The built-in scroller computes the target position once, a frame after
 * `NavigationEnd`. A freshly rendered chapter keeps moving for a while after
 * that (code highlighting, tab widgets, the page-enter animation, images), so
 * the page smooth-scrolled towards a stale position and routinely stopped
 * hundreds of pixels away from the heading. It also ignored the floating header.
 *
 * When the anchor is on a page that was just rendered, this scroller jumps to
 * it instantly and keeps it pinned under the header until the layout has been
 * stable for {@link SETTLE_TIME_MS}, or until the reader scrolls. Anchors on the
 * page already being read scroll smoothly, as before. The header offset comes
 * from the target's `scroll-margin-top`, which native fragment jumps (TOC and
 * heading links) honor as well, so both paths land in the same place.
 */
@Injectable()
export class DocsViewportScroller implements ViewportScroller {
  private readonly document = inject(DOCUMENT);
  private readonly window = this.document.defaultView as Window;
  private offset: () => [number, number] = () => [0, 0];
  private lastPathname: string | undefined;
  private stopPinning: (() => void) | undefined;

  setOffset(offset: [number, number] | (() => [number, number])): void {
    this.offset = Array.isArray(offset) ? () => offset : offset;
  }

  getScrollPosition(): [number, number] {
    return [this.window.scrollX, this.window.scrollY];
  }

  scrollToPosition(position: [number, number], options?: ScrollOptions): void {
    this.stopPinning?.();
    this.lastPathname = this.window.location.pathname;
    this.window.scrollTo({ ...options, left: position[0], top: position[1] });
  }

  scrollToAnchor(anchor: string, options?: ScrollOptions): void {
    this.stopPinning?.();
    const isSamePage = this.lastPathname === this.window.location.pathname;
    this.lastPathname = this.window.location.pathname;

    if (!isSamePage) {
      this.pinAnchor(anchor);
      return;
    }
    const target = this.findAnchor(anchor);
    if (target) {
      this.scrollBy(this.distanceToTarget(target), options);
      target.focus({ preventScroll: true });
    }
  }

  setHistoryScrollRestoration(scrollRestoration: 'auto' | 'manual'): void {
    try {
      this.window.history.scrollRestoration = scrollRestoration;
    } catch {
      // Not allowed in some sandboxed or inactive contexts; nothing to restore then.
    }
  }

  /**
   * Keeps the anchor aligned on every frame while the page settles. Until the
   * anchor renders, each frame just looks for it again.
   */
  private pinAnchor(anchor: string): void {
    const startedAt = this.window.performance.now();
    let lastMovedAt = startedAt;
    let target: HTMLElement | null = null;
    let frame = 0;

    const stop = () => {
      this.window.cancelAnimationFrame(frame);
      for (const type of USER_INPUT_EVENTS) {
        this.window.removeEventListener(type, stop, true);
      }
      if (this.stopPinning === stop) {
        this.stopPinning = undefined;
      }
    };
    for (const type of USER_INPUT_EVENTS) {
      this.window.addEventListener(type, stop, { capture: true, passive: true });
    }
    this.stopPinning = stop;

    const align = () => {
      const now = this.window.performance.now();
      if (!target) {
        target = this.findAnchor(anchor);
        target?.focus({ preventScroll: true });
      }
      // A position the page cannot scroll to (the anchor sits too close to the
      // bottom) leaves `scrollY` unchanged, so it counts as settled.
      if (target && this.scrollBy(this.distanceToTarget(target), { behavior: 'instant' })) {
        lastMovedAt = now;
      }
      if (now - lastMovedAt >= SETTLE_TIME_MS || now - startedAt >= MAX_PIN_TIME_MS) {
        stop();
        return;
      }
      frame = this.window.requestAnimationFrame(align);
    };
    align();
  }

  /** Vertical distance between the anchor and where it should rest. */
  private distanceToTarget(target: HTMLElement): number {
    const margin = parseFloat(this.window.getComputedStyle(target).scrollMarginTop) || 0;
    return target.getBoundingClientRect().top - margin - this.offset()[1];
  }

  /** Scrolls vertically and reports whether the page actually moved. */
  private scrollBy(distance: number, options?: ScrollOptions): boolean {
    if (Math.abs(distance) < 1) {
      return false;
    }
    const before = this.window.scrollY;
    this.window.scrollTo({ ...options, top: before + distance });
    return this.window.scrollY !== before;
  }

  /** Same lookup order as Angular's own scroller: `id` first, then `name`. */
  private findAnchor(anchor: string): HTMLElement | null {
    return (
      this.document.getElementById(anchor) ??
      (this.document.getElementsByName(anchor)[0] as HTMLElement | undefined) ??
      null
    );
  }
}

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { fromEvent, Subscription, timer } from 'rxjs';
import { debounceTime, take } from 'rxjs/operators';

interface HeadingElement {
  elementRef: HTMLElement;
  textContent: string;
  offsetTop: number;
}

@Component({
  selector: 'app-toc',
  templateUrl: './toc.component.html',
  styleUrls: ['./toc.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TocComponent implements OnInit, OnDestroy, OnChanges {
  @Input()
  contentReference: HTMLElement;

  @Input()
  headings: HeadingElement[] = [];
  activeId: number;

  @ViewChild('tocWrapper', { static: true })
  tocWrapper: ElementRef<HTMLElement>;

  isPositionFixed = true;

  private readonly scrollTopOffset = 100;
  private readonly scrollDebounceTime = 10;
  private scrollSubscription: Subscription;
  private timerSubscription: Subscription;
  private maxTopOffset: number;

  constructor(
    private readonly cd: ChangeDetectorRef,
    private readonly renderer: Renderer2,
  ) {}

  ngOnInit() {
    this.scrollSubscription = fromEvent(window, 'scroll')
      .pipe(debounceTime(this.scrollDebounceTime))
      .subscribe(_ => {
        this.findCurrentHeading();
        this.checkViewportBoundaries();
      });

    this.init();
    this.updateOffsetTop();
  }

  ngOnChanges() {
    this.init();
    this.updateOffsetTop();
  }

  ngOnDestroy() {
    this.scrollSubscription && this.scrollSubscription.unsubscribe();
    this.timerSubscription && this.timerSubscription.unsubscribe();
  }

  init() {
    this.lookupHeadings();
    this.findCurrentHeading();
    this.findMaxTopOffset();
  }

  lookupHeadings() {
    if (!this.contentReference) {
      return;
    }
    const headings = this.contentReference.querySelectorAll('h3, h4');
    const removeAnchor = (text: string) => {
      const anchorId = text && text.indexOf('#');
      return anchorId >= 0 ? text.slice(0, anchorId) : text;
    };
    this.headings = Array.from(headings).map((item: any) => ({
      offsetTop: item.offsetTop,
      textContent: removeAnchor(item.textContent),
      elementRef: item as HTMLElement,
    }));
  }

  updateOffsetTop() {
    // need to recalculate max position as well as headings offset
    // due to the Prisma HTML markup transformation (style code snippets)
    this.timerSubscription = timer(600, 200)
      .pipe(take(3))
      .subscribe(() => this.init());
  }

  navigateToAnchor($event: MouseEvent, elementRef: HTMLElement) {
    if (elementRef) {
      this.findCurrentHeading();
    }
  }

  findCurrentHeading() {
    const marginOffset = 15;
    const selectHeading = (i: number) => {
      const performChangeDetection = this.activeId !== i;
      this.activeId = i;
      performChangeDetection && this.cd.markForCheck();
    };
    for (let i = 0; i < this.headings.length; i++) {
      if (this.headings.length - 1 === i) {
        return selectHeading(i);
      } else if (
        this.headings[i + 1].offsetTop >=
        window.pageYOffset + this.scrollTopOffset + marginOffset
      ) {
        return selectHeading(i);
      }
    }
  }

  findMaxTopOffset() {
    if (!this.tocWrapper) {
      return;
    }
    const { nativeElement } = this.tocWrapper;
    const pageWrapperRef = document.querySelector('.page-wrapper');
    if (!pageWrapperRef || !nativeElement) {
      return;
    }
    const pageWrapperHeight = pageWrapperRef.scrollHeight;
    const tocWrapperHeight = nativeElement.scrollHeight;
    this.maxTopOffset =
      pageWrapperHeight - tocWrapperHeight - this.scrollTopOffset;
  }

  currentURL(): string {
    return window.location.href.split('#')[0];
  }

  checkViewportBoundaries() {
    this.isPositionFixed = this.maxTopOffset > window.pageYOffset;
    const { nativeElement } = this.tocWrapper;

    if (!this.isPositionFixed) {
      const initialTopOffset = 150;

      this.renderer.setStyle(
        nativeElement,
        'top',
        this.maxTopOffset + initialTopOffset + 'px',
      );
      this.renderer.setStyle(nativeElement, 'position', 'absolute');
    } else {
      this.renderer.removeStyle(nativeElement, 'top');
      this.renderer.removeStyle(nativeElement, 'position');
    }
  }

  trackById(index, item) {
    return item.id;
  }
}

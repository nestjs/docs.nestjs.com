import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Component } from '@angular/core';
import { PageNavComponent } from './page-nav.component';

@Component({ template: '', standalone: true })
class StubPageComponent {}

describe('PageNavComponent', () => {
  let fixture: ComponentFixture<PageNavComponent>;
  let router: Router;

  const links = () =>
    Array.from(
      fixture.nativeElement.querySelectorAll('a.page-nav__link'),
    ) as HTMLAnchorElement[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageNavComponent],
      providers: [
        provideRouter([
          { path: '', component: StubPageComponent },
          { path: 'cli/overview', component: StubPageComponent },
          { path: 'standalone-applications', component: StubPageComponent },
          { path: 'cli/monorepo', component: StubPageComponent },
          { path: 'enterprise', component: StubPageComponent },
          { path: 'support', component: StubPageComponent },
        ]),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  // The router URL has to settle before ngOnInit seeds the links, which is what
  // happens when a reader opens a docs page directly rather than navigating in.
  async function renderAt(url: string): Promise<void> {
    await router.navigateByUrl(url);
    fixture = TestBed.createComponent(PageNavComponent);
    fixture.detectChanges();
  }

  it('renders both links on a page in the middle of the sequence', async () => {
    await renderAt('/cli/overview');

    expect(fixture.componentInstance.prev).toEqual({
      title: 'Standalone apps',
      path: '/standalone-applications',
    });
    expect(fixture.componentInstance.next).toEqual({
      title: 'Workspaces',
      path: '/cli/monorepo',
    });
    expect(links().length).toBe(2);
    expect(links()[1].textContent).toContain('Workspaces');
    expect(links()[1].getAttribute('href')).toBe('/cli/monorepo');
  });

  it('labels each link for screen readers', async () => {
    await renderAt('/cli/overview');

    expect(links()[0].getAttribute('aria-label')).toBe(
      'Previous page: Standalone apps',
    );
    expect(links()[1].getAttribute('aria-label')).toBe('Next page: Workspaces');
  });

  it('renders only a next link on the first page', async () => {
    await renderAt('/');

    expect(fixture.componentInstance.prev).toBeNull();
    expect(links().length).toBe(1);
    expect(links()[0].classList).toContain('page-nav__link--next');
  });

  it('renders only a previous link on the last page', async () => {
    await renderAt('/support');

    expect(fixture.componentInstance.next).toBeNull();
    expect(links().length).toBe(1);
    expect(links()[0].classList).toContain('page-nav__link--prev');
  });

  it('renders nothing on a page outside the sidebar', async () => {
    await renderAt('/enterprise');

    expect(fixture.nativeElement.querySelector('.page-nav')).toBeNull();
  });

  it('updates the links when the reader navigates to another page', async () => {
    await renderAt('/');
    expect(fixture.componentInstance.next.path).toBe('/first-steps');

    await router.navigateByUrl('/cli/overview');
    fixture.detectChanges();

    expect(fixture.componentInstance.next).toEqual({
      title: 'Workspaces',
      path: '/cli/monorepo',
    });
  });
});

import { DocsPage } from './app.po';

describe('docs App', () => {
  let page: DocsPage;

  beforeEach(() => {
    page = new DocsPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!');
  });
});

import { UrlSegment } from '@angular/router';

export function versionedUrlRedirect({
  url,
}: {
  url: UrlSegment[];
}): string {
  if (url.length > 0 && /^v\d+$/.test(url[0].path)) {
    return '/' + url.slice(1).map((s) => s.path).join('/');
  }
  return '/';
}

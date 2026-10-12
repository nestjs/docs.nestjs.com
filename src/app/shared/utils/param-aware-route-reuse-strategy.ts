import { ActivatedRouteSnapshot, BaseRouteReuseStrategy } from '@angular/router';

/**
 * By default Angular keeps the component when only a route's params change,
 * so `/api/common/Injectable` -> `/api/common/Module` would reuse the page and
 * the shell (table of contents, focus, ads) would never hear about it. Routes
 * with `data: { reuseOnParamChange: false }` get a fresh component instead,
 * just like navigating between two chapters.
 */
export class ParamAwareRouteReuseStrategy extends BaseRouteReuseStrategy {
  override shouldReuseRoute(
    future: ActivatedRouteSnapshot,
    curr: ActivatedRouteSnapshot,
  ): boolean {
    if (!super.shouldReuseRoute(future, curr)) {
      return false;
    }
    return (
      future.data['reuseOnParamChange'] !== false ||
      JSON.stringify(future.params) === JSON.stringify(curr.params)
    );
  }
}

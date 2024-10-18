import { ActivatedRouteSnapshot, CanActivateFn } from '@angular/router';

export const RedirectGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  window.location.href = route.data['externalUrl'];
  return true;
};

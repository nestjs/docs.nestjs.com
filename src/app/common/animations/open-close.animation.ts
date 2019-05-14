import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';

export const openCloseAnimation = trigger('openCloseAnimation', [
  // 'remove' the element when is not opened
  state('false', style({ display: 'none' })),
  // Closed to Opened
  transition('false => true', [
    // Remove any previous style put by another state.
    // In other words, 'put back' the removed element
    style('*'),
    style({ height: 0, overflow: 'hidden' }),
    animate('250ms ease-out', style({ height: '*' })),
  ]),
  // Opened to Closed
  transition('true => false', [
    style({ height: '*', overflow: 'hidden' }),
    animate('250ms ease-in', style({ height: 0 })),
  ]),
]);

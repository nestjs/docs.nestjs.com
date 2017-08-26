import { trigger, animate, style, group, query, transition } from '@angular/animations';

export const routerTransition = trigger('routerTransition', [
  transition('* <=> *', [
    query(':enter, :leave', style({ position: 'fixed', width: '100%' })
      , { optional: true }),
    group([
      query(':enter', [
        style({ opacity: '0.0' }),
        animate('0.4s 0.6s ease-in-out', style({ opacity: '1.0' }))
      ], { optional: true }),
      query(':leave', [
        style({ opacity: '1.0' }),
        animate('0.4s ease-in-out', style({ opacity: '0.0' }))
      ], { optional: true }),
    ]),
  ]),
]);
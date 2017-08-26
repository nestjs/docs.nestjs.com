import { routerReducer } from '@ngrx/router-store';

import { userReducer } from './user/reducer';

export const rootReducers: any = {
  router: routerReducer,
  user: userReducer,
};
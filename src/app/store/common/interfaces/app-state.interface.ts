import { RouterReducerState } from '@ngrx/router-store';

import { UserState } from '../../user/interfaces/user-state.interface';

export interface AppState {
  router: RouterReducerState;
  user: UserState;
}

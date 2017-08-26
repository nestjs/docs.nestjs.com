import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { rootReducers } from './root-reducers';
import { rootInitialState } from './initial-state';
import { AppState } from './common';
import { rootEffects } from './root-effects';

const options = {
  initialState: rootInitialState,
};

@NgModule({
  imports: [
    StoreModule.forRoot<AppState>(
      rootReducers,
      options,
    ),
    EffectsModule.forRoot(rootEffects),
  ],
  exports: [
    StoreModule,
    EffectsModule,
  ]
})
export class AppStoreModule { }

import { AppState } from './common';

type Partial<T> = {
    [P in keyof T]?: T[P];
};

export const rootInitialState: Partial<AppState> = {};
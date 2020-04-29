import {InjectionToken} from '@angular/core';
import {NamedOptions} from './types';
import {ApolloOfflineClientOptions} from 'offix-client';

export const OFFIX_OPTIONS = new InjectionToken<ApolloOfflineClientOptions>(
  '[offix-angular] options',
);

export const OFFIX_NAMED_OPTIONS = new InjectionToken<NamedOptions>(
  '[offix-angular] named options',
);

import {
  ApplicationConfig, inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners
} from '@angular/core';
import {provideRouter} from '@angular/router';
import {provideHttpClient, withInterceptors} from '@angular/common/http';

import {routes} from './app.routes';
import {errorInterceptor} from './core/interceptors/error.interceptor';
import {mockAuthInterceptor} from './core/auth/auth.mock.interceptor';
import {environment} from '../environments/environment';
import {authInterceptor} from './core/auth/auth.interceptor';
import {AuthService} from './core/auth/auth.service';
import {FightWsService} from './core/fight/fight-ws.service';
import {FightWsMockService} from './core/fight/fight-ws-mock.service';
import {FightWsServiceImpl} from './core/fight/fight-ws-impl.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([errorInterceptor, environment.useMockApi ? mockAuthInterceptor : authInterceptor])),
    provideAppInitializer(() => {
      inject(AuthService).loadCurrentUser();
    }),
    {
      provide: FightWsService,
      useClass: environment.useMockApi ? FightWsMockService : FightWsServiceImpl,
    },
  ]
};


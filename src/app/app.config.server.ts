import {
  ApplicationConfig,
  ErrorHandler,
  mergeApplicationConfig,
} from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

/**
 * Angular's default handler only logs an error thrown while a page renders
 * (e.g. browser-only code reached at build time), and `ng build` then writes
 * whatever was rendered and exits 0. Rethrowing fails the prerender of that
 * page, and with it the build, instead of deploying a half-rendered page.
 */
class PrerenderErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    throw error;
  }
}

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    { provide: ErrorHandler, useClass: PrerenderErrorHandler },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);

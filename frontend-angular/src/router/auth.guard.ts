import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';

import { Route } from './paths';

// TODO: replace with actual store/auth service
const isAuthenticated = (): boolean => false;

export const authGuard: CanActivateFn = () => {
    const router = inject(Router);
    return isAuthenticated() ? true : router.createUrlTree([`/${Route.AUTH}`]);
};

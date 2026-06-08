import type { Routes } from '@angular/router';

import { Auth } from '@/pages/auth/auth';
import { NewPlace } from '@/pages/new-place/new-place';
import { UpdatePlace } from '@/pages/update-place/update-place';
import { UserPlaces } from '@/pages/user-places/user-places';
import { Users } from '@/pages/users/users';
import { AppRoute, authGuard, guestGuard } from '@/router';

export const routes: Routes = [
    { path: AppRoute.AUTH, component: Auth, canActivate: [guestGuard] },
    { path: AppRoute.HOME, component: Users, canActivate: [authGuard] },
    { path: AppRoute.USER_PLACES, component: UserPlaces, canActivate: [authGuard] },
    { path: AppRoute.NEW_PLACE, component: NewPlace, canActivate: [authGuard] },
    { path: AppRoute.UPDATE_PLACE, component: UpdatePlace, canActivate: [authGuard] },
    { path: AppRoute.ANY, redirectTo: '', pathMatch: 'full' },
];

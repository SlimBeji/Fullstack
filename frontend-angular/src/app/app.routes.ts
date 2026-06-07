import type { Routes } from '@angular/router';

import { Auth } from '@/pages/auth/auth';
import { NewPlace } from '@/pages/new-place/new-place';
import { UpdatePlace } from '@/pages/update-place/update-place';
import { UserPlaces } from '@/pages/user-places/user-places';
import { Users } from '@/pages/users/users';
import { authGuard, guestGuard, Route } from '@/router';

export const routes: Routes = [
    { path: Route.AUTH, component: Auth, canActivate: [guestGuard] },
    { path: Route.HOME, component: Users, canActivate: [authGuard] },
    { path: Route.USER_PLACES, component: UserPlaces, canActivate: [authGuard] },
    { path: Route.NEW_PLACE, component: NewPlace, canActivate: [authGuard] },
    { path: Route.UPDATE_PLACE, component: UpdatePlace, canActivate: [authGuard] },
    { path: Route.ANY, redirectTo: '', pathMatch: 'full' },
];

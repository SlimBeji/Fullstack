import type { Routes } from '@angular/router';

import { Auth } from '@/pages/auth/auth';
import { NewPlace } from '@/pages/new-place/new-place';
import { UpdatePlace } from '@/pages/update-place/update-place';
import { UserPlaces } from '@/pages/user-places/user-places';
import { Users } from '@/pages/users/users';

export const routes: Routes = [
    { path: 'auth', component: Auth },
    { path: '', component: Users },
    { path: ':userId/places', component: UserPlaces },
    { path: 'places/new', component: NewPlace },
    { path: 'places/:placeId', component: UpdatePlace },
    { path: '**', redirectTo: '', pathMatch: 'full' },
];

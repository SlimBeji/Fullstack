import { Component, inject, ViewEncapsulation } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AppRoute, userPlacesRoute } from '@/router';
import { AuthStore } from '@/store';

@Component({
    selector: 'app-nav-links',
    templateUrl: './nav-links.html',
    styleUrl: './nav-links.css',
    imports: [RouterLink, RouterLinkActive],
    encapsulation: ViewEncapsulation.None,
})
export class NavLinks {
    store = inject(AuthStore);

    AppRoute = AppRoute;
    userPlacesRoute = userPlacesRoute;
}

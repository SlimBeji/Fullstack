import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Backdrop } from '@/components/ui';
import { AppRoute } from '@/router';
import { AuthStore } from '@/store';

import { NavLinks } from '../nav-links/nav-links';
import { SideDrawer } from '../side-drawer/side-drawer';

@Component({
    standalone: true,
    selector: 'app-main-navigation',
    templateUrl: './main-navigation.html',
    styleUrl: './main-navigation.css',
    imports: [RouterLink, Backdrop, SideDrawer, NavLinks],
})
export class MainNavigation {
    store = inject(AuthStore);
    AppRoute = AppRoute;
    drawerIsOpen = signal(false);
}

import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { NavLinks, SideDrawer } from '@/components/navigation';
import { Backdrop } from '@/components/ui';
import { AppRoute } from '@/router';
import { AuthStore } from '@/store';

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

import { Component, input, output } from '@angular/core';

import { Button } from '@/components/form';
import { AppRoute } from '@/router/routes';
import type { Place } from '@/types';

import { PlaceItem } from '../place-item/place-item';

@Component({
    selector: 'app-places-list',
    templateUrl: './places-list.html',
    styleUrl: './places-list.css',
    imports: [Button, PlaceItem],
})
export class PlacesList {
    protected readonly AppRoute = AppRoute;

    // Inputs
    sameAuthenticatedUser = input<boolean>();
    items = input.required<Place[]>();

    // Outputs
    delete = output<void>();
}

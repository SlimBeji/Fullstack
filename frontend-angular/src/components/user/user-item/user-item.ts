import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Avatar } from '@/components/ui';
import { userPlacesRoute } from '@/router';
import type { User } from '@/types';

const placeholder = '/avatar_placeholder.jpg';

@Component({
    selector: 'app-user-item',
    templateUrl: './user-item.html',
    styleUrl: './user-item.css',
    imports: [RouterLink, Avatar],
    host: { class: 'contents' },
})
export class UserItem {
    // Init
    protected readonly userPlacesRoute = userPlacesRoute;

    // Inputs
    user = input.required<User>();

    // Computed
    imageUrl = computed(() => this.user().image_url || placeholder);

    placeNumber = computed(() => {
        const number = this.user().places.length;
        if (number > 1) {
            return `${number} Places`;
        }
        return `${number} Place`;
    });
}

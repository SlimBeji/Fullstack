import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { HttpStatusCode } from 'axios';

import { PlacesList } from '@/components/place';
import { HttpError, LoadingSpinner } from '@/components/ui';
import { BackendService } from '@/services';
import { AuthStore } from '@/store';
import type { Place } from '@/types';

@Component({
    selector: 'app-user-places',
    templateUrl: './user-places.html',
    imports: [PlacesList, HttpError, LoadingSpinner],
})
export class UserPlaces {
    // Init
    authStore = inject(AuthStore);
    backend = inject(BackendService);
    route = inject(ActivatedRoute);
    private params = toSignal(this.route.params);

    // Computed
    userId = computed(() => Number(this.params()?.['userId']) || undefined);

    isUserOwned = computed(() => this.userId() === this.authStore.userId());

    places = computed((): Place[] => {
        const data = this.backend.httpData().json?.data as Place[];
        if (this.backend.httpData().statusCode === HttpStatusCode.NotFound) return [];
        return data || [];
    });

    // Handlers
    private fetchPlaces() {
        const userId = this.userId();
        if (!userId) return;
        this.backend.sendRequest(`/places/?creator_id=${userId}`, 'get').catch(console.error);
    }

    private onUserIdUpdate = effect(() => {
        this.fetchPlaces();
    });

    deleteHandler() {
        this.fetchPlaces();
    }
}

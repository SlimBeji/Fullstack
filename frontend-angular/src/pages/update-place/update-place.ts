import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';

import { PlaceUpdateForm } from '@/components/place';

@Component({
    selector: 'app-update-place',
    templateUrl: './update-place.html',
    imports: [PlaceUpdateForm],
})
export class UpdatePlace {
    // Init
    route = inject(ActivatedRoute);
    private params = toSignal(this.route.params);

    // Computed
    placeId = computed(() => this.params()?.['placeId']);
}

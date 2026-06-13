import { Component, computed, inject, input, output, signal } from '@angular/core';

import { Button } from '@/components/form';
import { HttpError, LoadingSpinner, Map, Modal } from '@/components/ui';
import { updatePlaceRoute } from '@/router';
import { BackendService } from '@/services';
import { AuthStore } from '@/store';
import type { Place } from '@/types';

const placeholder = '/place_placeholder.jpg';

@Component({
    selector: 'app-place-item',
    templateUrl: './place-item.html',
    styleUrl: './place-item.css',
    imports: [Button, HttpError, LoadingSpinner, Map, Modal],
})
export class PlaceItem {
    // Init
    protected readonly updatePlaceRoute = updatePlaceRoute;
    private authStore = inject(AuthStore);
    backend = inject(BackendService);

    // Inputs
    place = input.required<Place>();

    // State
    showMap = signal(false);
    showDeleteModal = signal(false);

    // Computed
    isUserOwned = computed(() => this.authStore.userId() === this.place().creator_id);
    imageUrl = computed(() => this.place().image_url || placeholder);

    // Outputs
    delete = output<void>();

    // Handlers
    openMapHandler() {
        this.showMap.set(true);
    }

    closeMapHandler() {
        this.showMap.set(false);
    }

    openDeleteModalHandler() {
        this.showDeleteModal.set(true);
    }

    closeDeleteModalHandler() {
        this.showDeleteModal.set(false);
    }

    deleteHandler() {
        this.closeDeleteModalHandler();
        this.backend.sendRequest(`/places/${this.place().id}`, 'delete').then(() => {
            this.delete.emit();
        });
    }
}

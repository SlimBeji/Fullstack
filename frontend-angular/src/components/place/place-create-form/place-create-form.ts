import { Component, inject, signal } from '@angular/core';
import { form, FormRoot, minLength, validate } from '@angular/forms/signals';
import { Router } from '@angular/router';

import { Button, ImageUpload, Input } from '@/components/form';
import { HttpError, LoadingSpinner } from '@/components/ui';
import { AppRoute } from '@/router';
import { BackendService } from '@/services';
import { AuthStore } from '@/store';

interface PlaceCreateFormModel {
    title: string;
    address: string;
    description: string;
    lat: number;
    lng: number;
    image: { file: File | null; url: string };
}

@Component({
    selector: 'app-place-create-form',
    templateUrl: './place-create-form.html',
    styleUrl: './place-create-form.css',
    imports: [Button, Input, ImageUpload, LoadingSpinner, HttpError, FormRoot],
    host: { class: 'contents' },
    //encapsulation: ViewEncapsulation.None,
})
export class PlaceCreateForm {
    // Init
    private authStore = inject(AuthStore);
    private router = inject(Router);
    backend = inject(BackendService);

    // State
    model = signal<PlaceCreateFormModel>({
        title: '',
        address: '',
        description: '',
        lat: 0,
        lng: 0,
        image: { file: null, url: '' },
    });

    // Form
    placeForm = form(this.model, (path) => {
        minLength(path.title, 10, { message: 'Please enter a valid Title' });
        minLength(path.address, 1, { message: 'Please enter a valid address' });
        minLength(path.description, 10, { message: 'Please enter a valid Description' });

        validate(path.lat, (ctx) =>
            Number.isFinite(ctx.value())
                ? null
                : { kind: 'numeric', message: 'Please enter a valid Latitude' }
        );
        validate(path.lng, (ctx) =>
            Number.isFinite(ctx.value())
                ? null
                : { kind: 'numeric', message: 'Please enter a valid Longitude' }
        );
    });

    // Handlers
    private async submit() {
        const value = this.model();

        const formData = new FormData();
        formData.append('title', value.title);
        formData.append('description', value.description);
        formData.append('address', value.address);
        formData.append('lat', String(value.lat));
        formData.append('lng', String(value.lng));
        formData.append('creator_id', String(this.authStore.userId()));
        if (value.image.file) {
            formData.append('image', value.image.file);
        }

        try {
            await this.backend.sendRequest('/places/', 'post', formData);
            this.router.navigateByUrl(AppRoute.HOME);
        } catch (err) {
            console.log(err);
        }
    }

    onSubmit(e: Event) {
        e.preventDefault();
        this.submit();
    }
}

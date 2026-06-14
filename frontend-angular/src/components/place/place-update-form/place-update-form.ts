import type { OnInit } from '@angular/core';
import { Component, inject, input, signal } from '@angular/core';
import { form, FormRoot, minLength, validate } from '@angular/forms/signals';
import { Router } from '@angular/router';

import { Button, Input } from '@/components/form';
import { HttpError, LoadingSpinner } from '@/components/ui';
import { AppRoute } from '@/router';
import { BackendService } from '@/services';
import type { Place } from '@/types';

interface PlaceUpdateFormModel {
    title: string;
    address: string;
    description: string;
    lat: number;
    lng: number;
}

@Component({
    selector: 'app-place-update-form',
    templateUrl: './place-update-form.html',
    styleUrl: './place-update-form.css',
    imports: [Button, Input, LoadingSpinner, HttpError, FormRoot],
    providers: [BackendService],
    host: { class: 'contents' },
})
export class PlaceUpdateForm implements OnInit {
    // Init
    private router = inject(Router);
    backend = inject(BackendService);

    // Inputs
    placeId = input.required<string>();

    // State
    model = signal<PlaceUpdateFormModel>({
        title: '',
        address: '',
        description: '',
        lat: 0,
        lng: 0,
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

    // Events
    ngOnInit() {
        this.backend.sendRequest<Place>(`/places/${this.placeId()}`, 'get').then((resp) => {
            const { data } = resp;
            this.model.set({
                title: data.title,
                address: data.address,
                description: data.description,
                lat: data.location.lat,
                lng: data.location.lng,
            });
        });
    }

    // Handlers
    private async submit() {
        const value = this.model();

        try {
            await this.backend.sendRequest(`/places/${this.placeId()}`, 'put', {
                title: value.title,
                address: value.address,
                description: value.description,
                location: {
                    lat: value.lat,
                    lng: value.lng,
                },
            });
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

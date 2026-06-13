import type { ElementRef, OnDestroy } from '@angular/core';
import {
    afterNextRender,
    Component,
    effect,
    input,
    viewChild,
    ViewEncapsulation,
} from '@angular/core';
import type { Map as LeafletMap, Marker } from 'leaflet';
import * as L from 'leaflet';

import type { Location } from '@/types';

L.Icon.Default.imagePath = '';

L.Icon.Default.mergeOptions({
    iconUrl: '/marker-icon.png',
    iconRetinaUrl: '/marker-icon-2x.png',
    shadowUrl: '/marker-shadow.png',
});

@Component({
    selector: 'app-map',
    templateUrl: './map.html',
    styleUrl: './map.css',
    encapsulation: ViewEncapsulation.None,
})
export class Map implements OnDestroy {
    // Init
    private map: LeafletMap | null = null;
    private marker: Marker | null = null;
    private resizeObserver: ResizeObserver | null = null;

    // ViewChild
    private mapDiv = viewChild.required<ElementRef<HTMLDivElement>>('mapDiv');

    // Inputs
    position = input.required<Location>();
    zoom = input.required<number>();
    markerText = input.required<string>();

    // Handlers
    private readonly _onMount = afterNextRender(() => {
        const pos = this.position();
        const element = this.mapDiv().nativeElement;
        this.map = L.map(element).setView([pos.lat, pos.lng], this.zoom());

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(this.map);

        this.marker = L.marker([pos.lat, pos.lng]).addTo(this.map).bindPopup(this.markerText());

        this.map.invalidateSize();

        this.resizeObserver = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            if (width > 0 && height > 0) {
                this.map?.invalidateSize();
            }
        });
        this.resizeObserver.observe(element);
    });

    private readonly _onUpdate = effect(() => {
        const pos = this.position();
        if (this.map && this.marker) {
            this.marker.setLatLng([pos.lat, pos.lng]);
            this.map.setView([pos.lat, pos.lng], this.zoom());
        }
    });

    ngOnDestroy() {
        this.resizeObserver?.disconnect();
        this.map?.remove();
    }
}

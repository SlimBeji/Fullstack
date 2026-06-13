import { CdkPortal } from '@angular/cdk/portal';
import { Component, input, output } from '@angular/core';

import { Teleport } from '@/services';

import { Backdrop } from '../backdrop/backdrop';

@Component({
    selector: 'app-modal',
    templateUrl: './modal.html',
    styleUrl: './modal.css',
    imports: [Backdrop, CdkPortal, Teleport],
})
export class Modal {
    // Inputs
    show = input.required<boolean>();
    header = input.required<string>();
    style = input<Record<string, string>>();

    // Outputs
    closed = output<void>();
    submitted = output<Event>();

    // Handlers
    submitedHandler(e: Event) {
        e.preventDefault();
        this.submitted.emit(e);
    }
}
